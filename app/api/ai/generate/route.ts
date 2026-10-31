import { NextResponse } from "next/server";
import { generateRequestSchema } from "@/lib/resume/schema/resume";
import { generateResumeContent } from "@/lib/ai/service";
import { guard, jsonError, logEvent } from "@/lib/api/security";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = guard(request, "ai-generate", { limit: 12, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("The request body was not valid JSON.");
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(
      `Invalid request: ${issue?.path.join(".") || "body"} ${issue?.message || "is invalid"}.`,
      422,
      "validation_error",
    );
  }
  if (parsed.data.consent !== true) {
    return jsonError("Explicit consent is required before sending resume content to an AI provider.", 403, "consent_required");
  }

  const input = parsed.data;
  const result = await generateResumeContent({
    mode: input.mode === "raw-text" ? "raw-text" : "full",
    targetRole: input.targetRole,
    experienceLevel: input.experienceLevel,
    basics: input.basics as Record<string, unknown> | undefined,
    facts: input.facts ?? "",
    rawText: input.rawText,
  });

  logEvent({
    scope: "generate",
    ok: result.ok,
    provider: result.ok ? result.value.provider : undefined,
    code: result.ok ? undefined : result.error.code,
    latencyMs: result.ok ? result.value.latencyMs : undefined,
    attempts: result.attempts.length,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, attempts: result.attempts }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    provider: result.value.provider,
    model: result.value.model,
    latencyMs: result.value.latencyMs,
    attempts: result.attempts,
    data: result.value.data,
  });
}
