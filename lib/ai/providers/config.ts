
import type { ProviderConfig, ProviderId } from "@/lib/ai/types";

/**
 * AI Provider Catalogue
 *
 * Uses officially documented API endpoints.
 * API keys are read server-side only.
 *
 * Models can be overridden using environment variables.
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
    freeTier:
      "Gemini API offers a free tier with model-specific request and token limits. Check current availability and quotas.",
  },

  groq: {
    id: "groq",
    label: "Groq",
    kind: "openai",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "openai/gpt-oss-120b",
    envKey: "GROQ_API_KEY",
    envModelKey: "GROQ_MODEL",
    timeoutMs: 24_000,
    docsUrl: "https://console.groq.com/docs/openai",
    freeTier:
      "Groq provides developer API access with model-specific request and token limits.",
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
    freeTier:
      "OpenRouter offers selected free model variants subject to availability and rate limits.",
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
    freeTier:
      "Cerebras Cloud provides developer access subject to current model availability and usage limits.",
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
    freeTier:
      "Hugging Face Inference Providers offer usage subject to account credits and provider-specific limits.",
  },
};

/**
 * Default provider fallback order.
 *
 * Providers without API keys are automatically skipped.
 */
export const DEFAULT_ORDER: ProviderId[] = [
  "gemini",
  "groq",
  "openrouter",
  "cerebras",
  "huggingface",
];

/**
 * Validates a provider ID.
 */
const isProviderId = (value: string): value is ProviderId => {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
};

/**
 * Resolves provider order from environment variables.
 *
 * Example:
 * AI_PROVIDER_ORDER=gemini,groq,openrouter
 */
export const resolveProviderOrder = (
  env: NodeJS.ProcessEnv = process.env
): ProviderId[] => {
  const raw = env.AI_PROVIDER_ORDER?.trim();

  if (!raw) {
    return [...DEFAULT_ORDER];
  }

  const parsed = raw
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(isProviderId);

  return parsed.length
    ? Array.from(new Set(parsed))
    : [...DEFAULT_ORDER];
};

/**
 * Gets the model configured for a provider.
 *
 * Environment variables take priority over defaults.
 */
export const providerModel = (
  config: ProviderConfig,
  env: NodeJS.ProcessEnv = process.env
): string => {
  const customModel = env[config.envModelKey]?.trim();

  return customModel || config.model;
};

/**
 * Gets a provider API key.
 *
 * Empty or missing keys are treated as unconfigured.
 */
export const providerKey = (
  config: ProviderConfig,
  env: NodeJS.ProcessEnv = process.env
): string | undefined => {
  const value = env[config.envKey]?.trim();

  if (!value || value.length <= 4) {
    return undefined;
  }

  return value;
};

/**
 * Returns providers that have configured API keys.
 */
export const configuredProviders = (
  env: NodeJS.ProcessEnv = process.env
): ProviderId[] => {
  return resolveProviderOrder(env).filter((id) =>
    Boolean(providerKey(PROVIDERS[id], env))
  );
};

/**
 * Returns the configuration for a provider.
 */
export const getProviderConfig = (
  id: ProviderId
): ProviderConfig => {
  return PROVIDERS[id];
};
