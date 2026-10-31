"use client";

import type { GeneratedResume, ImprovedText, ReviewResult, TailorResult } from "@/lib/ai/schemas";
import type { ProviderId } from "@/lib/ai/types";

export interface AiFailure {
  code: string;
  message: string;
  help?: string;
  retryable?: boolean;
}

export interface AiSuccess<T> {
  ok: true;
  data: T;
  provider: ProviderId | string;
  model: string;
  latencyMs: number;
  attempts: { provider: string; status: string; code?: string }[];
}

export type AiResult<T> = AiSuccess<T> | { ok: false; error: AiFailure };

const post = async <T>(path: string, body: Record<string, unknown>): Promise<AiResult<T>> => {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, consent: true }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data?: T;
      provider?: string;
      model?: string;
      latencyMs?: number;
      attempts?: { provider: string; status: string; code?: string }[];
      error?: AiFailure;
    };
    if (!response.ok || !payload.ok || payload.data === undefined) {
      return { ok: false, error: payload.error ?? { code: "unknown", message: "The AI request failed." } };
    }
    return {
      ok: true,
      data: payload.data,
      provider: payload.provider ?? "unknown",
      model: payload.model ?? "unknown",
      latencyMs: payload.latencyMs ?? 0,
      attempts: payload.attempts ?? [],
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "network",
        message: `Could not reach the AI service (${(error as Error).message}). Your resume is safe — nothing was changed.`,
        retryable: true,
      },
    };
  }
};

export interface ProviderStatus {
  ok: boolean;
  aiEnabled: boolean;
  configured: string[];
  order: string[];
  providers: { id: string; label: string; configured: boolean; model: string; docsUrl: string; freeTier: string; lastErrorCode?: string }[];
  note: string;
}

export const fetchAiStatus = async (): Promise<ProviderStatus | null> => {
  try {
    const response = await fetch("/api/ai/status", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as ProviderStatus;
  } catch {
    return null;
  }
};

export const aiGenerate = (body: Record<string, unknown>) => post<GeneratedResume>("/api/ai/generate", body);
export const aiImprove = (body: Record<string, unknown>) => post<ImprovedText | { bullets: string[]; notes?: string[] }>("/api/ai/improve", body);
export const aiReview = (body: Record<string, unknown>) => post<ReviewResult>("/api/ai/review", body);
export const aiTailor = (body: Record<string, unknown>) => post<TailorResult>("/api/ai/tailor", body);
