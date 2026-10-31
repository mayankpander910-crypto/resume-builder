import { NextResponse } from "next/server";
import { reviewRequestSchema } from "@/lib/resume/schema/resume";
import { reviewResume } from "@/lib/ai/service";
import { resumeToPromptText } from "@/lib/resume/renderer/plain-text";
import { guard, jsonError, logEvent } from "@/lib/api/security";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = guard(request, "ai-review", { limit: 15, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("The request body was not valid JSON.");
  }

  const parsed = reviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(`Invalid request: ${issue?.path.join(".") || "body"} ${issue?.message || "is invalid"}.`, 422, "validation_error");
  }

  const resumeText = parsed.data.resume
    ? resumeToPromptText(parsed.data.resume)
    : (parsed.data.plainText ?? "").slice(0, 12_000);

  if (!resumeText.trim()) {
    return jsonError("Add some resume content before requesting a review.", 422, "empty_content");
  }

  const result = await reviewResume({ resumeText, jobDescription: parsed.data.jobDescription });

  logEvent({
    scope: "review",
    ok: result.ok,
    provider: result.ok ? result.value.provider : undefined,
    code: result.ok ? undefined : result.error.code,
    latencyMs: result.ok ? result.value.latencyMs : undefined,
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
