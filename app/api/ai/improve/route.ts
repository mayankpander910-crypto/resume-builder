import { NextResponse } from "next/server";
import { improveRequestSchema } from "@/lib/resume/schema/resume";
import { improveContent } from "@/lib/ai/service";
import { guard, jsonError, logEvent } from "@/lib/api/security";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = guard(request, "ai-improve", { limit: 40, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("The request body was not valid JSON.");
  }

  const parsed = improveRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(`Invalid request: ${issue?.path.join(".") || "body"} ${issue?.message || "is invalid"}.`, 422, "validation_error");
  }
  if (!parsed.data.content.trim()) {
    return jsonError("There is nothing to improve yet — write a first draft and try again.", 422, "empty_content");
  }

  const result = await improveContent({
    action: parsed.data.action,
    target: parsed.data.target,
    content: parsed.data.content,
    context: parsed.data.context,
    jobDescription: parsed.data.jobDescription,
  });

  logEvent({
    scope: `improve:${parsed.data.action}`,
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
