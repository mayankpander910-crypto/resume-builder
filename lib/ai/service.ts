import { z } from "zod";
import {
  bulletsSchema,
  generatedResumeSchema,
  improvedTextSchema,
  parseJsonLoose,
  reviewSchema,
  tailorSchema,
} from "@/lib/ai/schemas";
import { runWithFallback, type OrchestratorOptions } from "@/lib/ai/orchestrator";
import { ProviderError } from "@/lib/ai/providers/http";
import { buildGeneratePrompt, buildImprovePrompt, buildReviewPrompt, buildTailorPrompt, type GenerateInput, type ImproveInput } from "@/lib/ai/prompts";
import type { AiTask, ProviderId, RunResult } from "@/lib/ai/types";

/**
 * One place where prompt + provider + validation meet. Everything returns the
 * same shape so routes and the UI never branch on provider identity.
 */

interface Validated<T> {
  data: T;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  attempts: RunResult["attempts"];
}

export type ServiceResult<T> = { ok: true; value: Validated<T>; attempts: RunResult["attempts"] } | { ok: false; error: NonNullable<Extract<RunResult, { ok: false }>["error"]>; attempts: RunResult["attempts"] };

const validateWith = <T>(schema: z.ZodType<T>) => (text: string) => {
  const parsed = parseJsonLoose(text);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`output_schema:${issue?.path.join(".") ?? "root"}:${issue?.message ?? "invalid"}`);
  }
  return result.data;
};

const runTask = async <T>(
  task: AiTask,
  schema: z.ZodType<T>,
  options: OrchestratorOptions = {},
): Promise<ServiceResult<T>> => {
  let captured: T | undefined;
  const validate = (text: string) => {
    try {
      captured = validateWith(schema)(text);
    } catch (error) {
      const issue = (error as Error).message;
      throw new ProviderError("invalid_output", `The model returned content that did not match the expected shape (${issue}).`, {
        retryable: true,
      });
    }
  };

  const result = await runWithFallback(task, { ...options, validate });
  if (!result.ok) return { ok: false, error: result.error, attempts: result.attempts };
  if (captured === undefined) {
    return {
      ok: false,
      error: { code: "invalid_output", message: "The AI returned content we could not validate. Nothing was applied.", retryable: true },
      attempts: result.attempts,
    };
  }
  return {
    ok: true,
    value: { data: captured, provider: result.provider, model: result.model, latencyMs: result.latencyMs, attempts: result.attempts },
    attempts: result.attempts,
  };
};

/* ------------------------------------------------------------------- tasks */

export const generateResumeContent = async (input: GenerateInput, options?: OrchestratorOptions) => {
  const { system, user } = buildGeneratePrompt(input);
  return runTask(
    { name: "generate", system, user, temperature: 0.35, maxTokens: 2400, json: true },
    generatedResumeSchema,
    options,
  );
};

export const improveContent = async (input: ImproveInput, options?: OrchestratorOptions) => {
  const { system, user } = buildImprovePrompt(input);
  if (input.action === "bullets") {
    const result = await runTask(
      { name: "improve-bullets", system, user, temperature: 0.4, maxTokens: 900, json: true },
      bulletsSchema,
      options,
    );
    return result;
  }
  return runTask(
    { name: `improve-${input.action}`, system, user, temperature: 0.4, maxTokens: 1400, json: true },
    improvedTextSchema,
    options,
  );
};

export const reviewResume = async (input: { resumeText: string; jobDescription?: string }, options?: OrchestratorOptions) => {
  const { system, user } = buildReviewPrompt(input);
  return runTask(
    { name: "review", system, user, temperature: 0.25, maxTokens: 2200, json: true },
    reviewSchema,
    options,
  );
};

export const tailorResume = async (input: { resumeText: string; jobDescription: string }, options?: OrchestratorOptions) => {
  const { system, user } = buildTailorPrompt(input);
  return runTask(
    { name: "tailor", system, user, temperature: 0.3, maxTokens: 2200, json: true },
    tailorSchema,
    options,
  );
};
