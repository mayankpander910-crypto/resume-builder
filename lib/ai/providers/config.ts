import type { ProviderConfig, ProviderId } from "@/lib/ai/types";

/**
 * Provider catalogue.
 *
 * Only officially documented, key-based HTTP APIs are used. Every provider
 * exposes an OpenAI-compatible `/chat/completions` endpoint except Google
 * Gemini, which uses its own `generateContent` shape.
 *
 * Free-tier notes are deliberately conservative: quotas and model availability
 * change. Treat everything below as "check the link before relying on it".
 */
export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    kind: "gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-2.5-flash",
    envKey: "GEMINI_API_KEY",
    envModelKey: "GEMINI_MODEL",
    timeoutMs: 28_000,
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    freeTier: "Gemini API has a free tier with per-minute and per-day rate limits; limits vary by model.",
  },
  groq: {
    id: "groq",
    label: "Groq",
    kind: "openai",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    envKey: "GROQ_API_KEY",
    envModelKey: "GROQ_MODEL",
    timeoutMs: 24_000,
    docsUrl: "https://console.groq.com/docs/openai",
    freeTier: "Groq offers a free developer tier with request and token rate limits per model.",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    envKey: "OPENROUTER_API_KEY",
    envModelKey: "OPENROUTER_MODEL",
    timeoutMs: 30_000,
    docsUrl: "https://openrouter.ai/docs/api-reference/overview",
    freeTier: "OpenRouter lists `:free` model variants with lower rate limits; paid credits are optional.",
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    kind: "openai",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama3.3-70b",
    envKey: "CEREBRAS_API_KEY",
    envModelKey: "CEREBRAS_MODEL",
    timeoutMs: 24_000,
    docsUrl: "https://inference-docs.cerebras.ai/api-reference/chat-completions",
    freeTier: "Cerebras Cloud offers a free developer tier with rate limits; see their pricing page for current terms.",
  },
  huggingface: {
    id: "huggingface",
    label: "Hugging Face",
    kind: "openai",
    endpoint: "https://router.huggingface.co/v1/chat/completions",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    envKey: "HUGGINGFACE_API_KEY",
    envModelKey: "HUGGINGFACE_MODEL",
    timeoutMs: 30_000,
    docsUrl: "https://huggingface.co/docs/inference-providers",
    freeTier: "Inference Providers include monthly credits for signed-in accounts; overage requires payment.",
  },
};

export const DEFAULT_ORDER: ProviderId[] = ["gemini", "groq", "openrouter", "cerebras", "huggingface"];

const isProviderId = (value: string): value is ProviderId => value in PROVIDERS;

/** Provider order from `AI_PROVIDER_ORDER`, falling back to the default chain. */
export const resolveProviderOrder = (env: NodeJS.ProcessEnv = process.env): ProviderId[] => {
  const raw = env.AI_PROVIDER_ORDER?.trim();
  if (!raw) return [...DEFAULT_ORDER];
  const parsed = raw
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(isProviderId);
  return parsed.length ? Array.from(new Set(parsed)) : [...DEFAULT_ORDER];
};

export const providerModel = (config: ProviderConfig, env: NodeJS.ProcessEnv = process.env): string =>
  env[config.envModelKey]?.trim() || config.model;

export const providerKey = (config: ProviderConfig, env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const value = env[config.envKey];
  return value && value.trim().length > 4 ? value.trim() : undefined;
};

export const configuredProviders = (env: NodeJS.ProcessEnv = process.env): ProviderId[] =>
  resolveProviderOrder(env).filter((id) => Boolean(providerKey(PROVIDERS[id], env)));
