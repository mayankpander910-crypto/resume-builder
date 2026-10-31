import type { AiTask, AttemptRecord, ErrorCode, ProviderId, RunResult } from "@/lib/ai/types";
import { PROVIDERS, providerKey, providerModel, resolveProviderOrder } from "@/lib/ai/providers/config";
import { callProvider, ProviderError } from "@/lib/ai/providers/http";

export interface OrchestratorOptions {
  /** Wall-clock budget for the whole chain. */
  deadlineMs?: number;
  /** How many times a single provider may be attempted (1 = no retry). */
  attemptsPerProvider?: number;
  /** Base backoff between retries of the same provider. */
  backoffMs?: number;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
  /** Validate/normalise provider text before accepting it. Throw to trigger fallback. */
  validate?: (text: string, provider: ProviderId) => void;
  sleep?: (ms: number) => Promise<void>;
}

export interface ProviderHealth {
  provider: ProviderId;
  configured: boolean;
  requests: number;
  successes: number;
  failures: number;
  lastErrorCode?: ErrorCode;
  lastLatencyMs?: number;
  lastUsedAt?: string;
  /** Consecutive failures — used to deprioritise a provider for a short while. */
  consecutiveFailures: number;
  cooldownUntil?: number;
}

const health = new Map<ProviderId, ProviderHealth>();

const getHealth = (provider: ProviderId): ProviderHealth => {
  const existing = health.get(provider);
  if (existing) return existing;
  const fresh: ProviderHealth = { provider, configured: false, requests: 0, successes: 0, failures: 0, consecutiveFailures: 0 };
  health.set(provider, fresh);
  return fresh;
};

export const getProviderHealth = (env: NodeJS.ProcessEnv = process.env): ProviderHealth[] =>
  resolveProviderOrder(env).map((id) => {
    const record = { ...getHealth(id) };
    record.configured = Boolean(providerKey(PROVIDERS[id], env));
    return record;
  });

export const resetProviderHealth = () => health.clear();

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const recordAttempt = (record: AttemptRecord): void => {
  const entry = getHealth(record.provider === "none" ? "gemini" : record.provider);
  if (record.provider === "none") return;
  entry.requests += 1;
  entry.lastLatencyMs = record.latencyMs;
  entry.lastUsedAt = new Date().toISOString();
  if (record.status === "ok") {
    entry.successes += 1;
    entry.consecutiveFailures = 0;
    entry.cooldownUntil = undefined;
  } else if (record.status === "failed") {
    entry.failures += 1;
    entry.consecutiveFailures += 1;
    entry.lastErrorCode = record.code;
    // Cool a provider down after repeated failures so we stop paying its timeout.
    if (entry.consecutiveFailures >= 2) {
      entry.cooldownUntil = Date.now() + Math.min(60_000 * entry.consecutiveFailures, 5 * 60_000);
    }
  }
};

const HELP: Record<string, string> = {
  not_configured:
    "No AI provider key is configured. Add GEMINI_API_KEY (or GROQ_API_KEY / OPENROUTER_API_KEY) to .env.local and restart. The editor works fully without AI.",
  all_failed:
    "Every configured provider failed. This is usually a temporary quota or outage — try again in a minute, or check /api/ai/status.",
};

/**
 * Runs a task through the configured provider chain.
 *
 * Behaviour:
 *  - providers are tried in configured order; unconfigured ones are skipped;
 *  - rate limits, timeouts, 5xx and network errors are retried with bounded
 *    exponential backoff **on the same provider**, then the chain moves on;
 *  - auth/model errors skip the provider immediately (retrying is pointless);
 *  - invalid or unparseable output counts as a failure and triggers fallback;
 *  - user-facing validation errors never reach this layer.
 */
export const runWithFallback = async (task: AiTask, options: OrchestratorOptions = {}): Promise<RunResult> => {
  const env = options.env ?? process.env;
  const order = resolveProviderOrder(env);
  const attemptsPerProvider = Math.max(1, options.attemptsPerProvider ?? 2);
  const backoffMs = options.backoffMs ?? 350;
  const sleep = options.sleep ?? defaultSleep;
  const deadline = Date.now() + (options.deadlineMs ?? 55_000);
  const attempts: AttemptRecord[] = [];
  let sawConfigured = false;

  for (const providerId of order) {
    const config = PROVIDERS[providerId];
    const apiKey = providerKey(config, env);
    if (!apiKey) {
      attempts.push({ provider: providerId, status: "skipped", code: "missing_key" });
      continue;
    }
    sawConfigured = true;

    const stateForProvider = getHealth(providerId);
    if (stateForProvider.cooldownUntil && stateForProvider.cooldownUntil > Date.now()) {
      attempts.push({ provider: providerId, status: "skipped", code: "quota" });
      continue;
    }

    const model = providerModel(config, env);
    let lastError: ProviderError | null = null;

    for (let attempt = 1; attempt <= attemptsPerProvider; attempt += 1) {
      if (Date.now() > deadline) {
        lastError = new ProviderError("timeout", "The AI request exceeded the total time budget.", { retryable: false });
        break;
      }
      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(config.timeoutMs, Math.max(deadline - Date.now(), 1_000)));

      try {
        const result = await callProvider(config, model, apiKey, {
          task,
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (options.validate) options.validate(result.text, providerId);
        const latencyMs = Date.now() - started;
        const record: AttemptRecord = { provider: providerId, status: "ok", latencyMs, retried: attempt - 1 };
        attempts.push(record);
        recordAttempt(record);
        return { ok: true, text: result.text, provider: providerId, model, latencyMs, attempts };
      } catch (error) {
        clearTimeout(timer);
        const providerError =
          error instanceof ProviderError
            ? error
            : new ProviderError(
                (error as Error)?.name === "AbortError" ? "timeout" : "network",
                (error as Error)?.name === "AbortError"
                  ? `${config.label} did not respond within ${Math.round(config.timeoutMs / 1000)}s.`
                  : `Could not reach ${config.label}.`,
                { retryable: true },
              );
        lastError = providerError;
        attempts.push({
          provider: providerId,
          status: "failed",
          code: providerError.code,
          httpStatus: providerError.httpStatus,
          latencyMs: Date.now() - started,
          retried: attempt - 1,
        });

        if (providerError.skipProvider || !providerError.retryable || attempt === attemptsPerProvider) break;

        const backoff = Math.min(providerError.retryAfterMs ?? backoffMs * 2 ** (attempt - 1), 4_000);
        await sleep(backoff + Math.floor(Math.random() * 120));
      }
    }

    recordAttempt({
      provider: providerId,
      status: "failed",
      code: lastError?.code ?? "server",
      httpStatus: lastError?.httpStatus,
    });

    // A bad request is the user's payload, not the provider: stop the chain so we
    // do not burn other quotas on something that will fail everywhere.
    if (lastError?.code === "bad_request") {
      return {
        ok: false,
        error: {
          code: "bad_request",
          message: lastError.message,
          retryable: false,
          help: "Shorten the input or remove unusual characters and try again.",
        },
        attempts,
      };
    }
  }

  if (!sawConfigured) {
    return {
      ok: false,
      error: { code: "not_configured", message: "No AI provider is configured on this deployment.", retryable: false, help: HELP.not_configured },
      attempts,
    };
  }

  return {
    ok: false,
    error: {
      code: "all_failed",
      message:
        attempts.length > 0
          ? `All ${attempts.filter((a) => a.status === "failed").length} provider attempt(s) failed. Last reason: ${attempts[attempts.length - 1]?.code ?? "unknown"}.`
          : "No provider could be attempted.",
      retryable: true,
      help: HELP.all_failed,
    },
    attempts,
  };
};
