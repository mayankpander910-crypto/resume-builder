import type { AiTask, ErrorCode, ProviderConfig } from "@/lib/ai/types";

/**
 * Typed provider failure. `retryable` decides whether the orchestrator retries
 * the same provider; `kind` decides whether it may fall back at all.
 */
export class ProviderError extends Error {
  code: ErrorCode;
  httpStatus?: number;
  retryable: boolean;
  /** `true` when the request never should have been sent (bad key, bad model). */
  skipProvider: boolean;
  retryAfterMs?: number;

  constructor(
    code: ErrorCode,
    message: string,
    options: { httpStatus?: number; retryable?: boolean; skipProvider?: boolean; retryAfterMs?: number } = {},
  ) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.httpStatus = options.httpStatus;
    this.retryable = options.retryable ?? false;
    this.skipProvider = options.skipProvider ?? false;
    this.retryAfterMs = options.retryAfterMs;
  }
}

/** Maps an HTTP response to a classified error. Never includes request bodies. */
export const classifyHttpError = (status: number, providerLabel: string, retryAfterHeader?: string | null): ProviderError => {
  const suffix = ` (${providerLabel}, HTTP ${status})`;
  const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
  if (status === 401 || status === 403) {
    return new ProviderError("auth", `The ${providerLabel} API key was rejected${suffix}.`, { httpStatus: status, skipProvider: true });
  }
  if (status === 404) {
    return new ProviderError("model_unavailable", `The configured ${providerLabel} model is not available${suffix}.`, {
      httpStatus: status,
      skipProvider: true,
    });
  }
  if (status === 402 || status === 402.5) {
    return new ProviderError("quota", `The ${providerLabel} account has no remaining quota${suffix}.`, { httpStatus: status, skipProvider: true });
  }
  if (status === 429) {
    return new ProviderError("rate_limit", `${providerLabel} rate limit or quota reached${suffix}.`, {
      httpStatus: status,
      retryable: true,
      retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
    });
  }
  if (status === 408) {
    return new ProviderError("timeout", `${providerLabel} timed out${suffix}.`, { httpStatus: status, retryable: true });
  }
  if (status === 400 || status === 413 || status === 422) {
    return new ProviderError("bad_request", `The ${providerLabel} request was rejected as invalid${suffix}.`, {
      httpStatus: status,
    });
  }
  if (status >= 500) {
    return new ProviderError("server", `${providerLabel} returned a server error${suffix}.`, { httpStatus: status, retryable: true });
  }
  return new ProviderError("server", `${providerLabel} returned an unexpected status${suffix}.`, { httpStatus: status, retryable: false });
};

const extractErrorMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  const message = record.message;
  return typeof message === "string" ? message : undefined;
};

export interface CallOptions {
  task: AiTask;
  signal?: AbortSignal;
}

/** Reads a JSON body defensively; providers occasionally return HTML error pages. */
const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 240) } };
  }
};

/* ------------------------------------------------------------ openai shape */

interface OpenAiChoiceMessage {
  content?: string | Array<{ type?: string; text?: string }>;
}

export const callOpenAiCompatible = async (
  config: ProviderConfig,
  model: string,
  apiKey: string,
  options: CallOptions,
): Promise<{ text: string }> => {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: options.task.system },
      { role: "user", content: options.task.user },
    ],
    temperature: options.task.temperature,
    max_tokens: options.task.maxTokens,
    stream: false,
  };
  if (options.task.json) {
    body.response_format = { type: "json_object" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (config.id === "openrouter") {
    headers["HTTP-Referer"] = "https://resume-forge.local";
    headers["X-Title"] = "Resume Forge";
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const error = classifyHttpError(response.status, config.label, response.headers.get("retry-after"));
    const detail = extractErrorMessage(payload);
    if (detail) error.message = `${error.message} Provider said: ${detail.slice(0, 200)}`;
    throw error;
  }

  const choices = (payload as { choices?: { message?: OpenAiChoiceMessage }[] })?.choices;
  const content = choices?.[0]?.message?.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((part) => part?.text ?? "").join("")
        : "";
  if (!text.trim()) {
    throw new ProviderError("invalid_output", `${config.label} returned an empty completion.`, { retryable: true });
  }
  return { text };
};

/* -------------------------------------------------------------- gemini shape */

export const callGemini = async (
  config: ProviderConfig,
  model: string,
  apiKey: string,
  options: CallOptions,
): Promise<{ text: string }> => {
  const url = `${config.endpoint}/${encodeURIComponent(model)}:generateContent`;
  const body: Record<string, unknown> = {
    systemInstruction: { role: "system", parts: [{ text: options.task.system }] },
    contents: [{ role: "user", parts: [{ text: options.task.user }] }],
    generationConfig: {
      temperature: options.task.temperature,
      maxOutputTokens: options.task.maxTokens,
      ...(options.task.json ? { responseMimeType: "application/json" } : {}),
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const error = classifyHttpError(response.status, config.label, response.headers.get("retry-after"));
    const detail = extractErrorMessage(payload);
    if (detail) error.message = `${error.message} Provider said: ${detail.slice(0, 200)}`;
    throw error;
  }

  const candidates = (payload as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] })
    ?.candidates;
  const text = candidates?.[0]?.content?.parts?.map((part) => part?.text ?? "").join("") ?? "";
  if (!text.trim()) {
    const blocked = candidates?.[0]?.finishReason === "SAFETY";
    throw new ProviderError(
      "invalid_output",
      blocked ? `${config.label} blocked the response for safety reasons.` : `${config.label} returned an empty completion.`,
      { retryable: !blocked },
    );
  }
  return { text };
};

export const callProvider = async (
  config: ProviderConfig,
  model: string,
  apiKey: string,
  options: CallOptions,
): Promise<{ text: string }> =>
  config.kind === "gemini"
    ? callGemini(config, model, apiKey, options)
    : callOpenAiCompatible(config, model, apiKey, options);
