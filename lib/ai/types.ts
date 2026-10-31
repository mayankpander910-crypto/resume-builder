export type ProviderId = "gemini" | "groq" | "openrouter" | "huggingface" | "cerebras";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  /** Default model; overridable with `<PROVIDER>_MODEL`. */
  model: string;
  envKey: string;
  envModelKey: string;
  /** Transport shape. Gemini has its own endpoint; the rest are OpenAI-compatible. */
  kind: "gemini" | "openai";
  endpoint: string;
  timeoutMs: number;
  docsUrl: string;
  /** Documented free-tier status, written conservatively. */
  freeTier: string;
}

export type ErrorCode =
  | "missing_key"
  | "auth"
  | "rate_limit"
  | "quota"
  | "server"
  | "timeout"
  | "network"
  | "bad_request"
  | "model_unavailable"
  | "invalid_output"
  | "all_failed"
  | "not_configured";

export interface AttemptRecord {
  provider: ProviderId | "none";
  status: "ok" | "failed" | "skipped";
  code?: ErrorCode;
  /** HTTP status when the failure came from the provider. */
  httpStatus?: number;
  latencyMs?: number;
  retried?: number;
}

export interface RunSuccess {
  ok: true;
  text: string;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  attempts: AttemptRecord[];
}

export interface RunFailure {
  ok: false;
  error: {
    code: ErrorCode | "all_failed";
    message: string;
    retryable: boolean;
    help?: string;
  };
  attempts: AttemptRecord[];
}

export type RunResult = RunSuccess | RunFailure;

export interface AiTask {
  /** Short label used only for logging/metrics — never contains user content. */
  name: string;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  /** Ask the provider for JSON output where supported. */
  json: boolean;
}
