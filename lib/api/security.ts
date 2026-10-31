import { NextResponse } from "next/server";

/**
 * Lightweight server-side protections for the AI routes.
 *
 * Note: the limiter is in-memory, so it protects a single instance. Behind a
 * multi-instance deployment, swap `hits` for Redis (the interface stays the same).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const rateLimit = (
  key: string,
  options: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number; resetAt: number } => {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, fresh);
    return { allowed: true, remaining: options.limit - 1, resetAt: fresh.resetAt };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= options.limit, remaining: Math.max(options.limit - bucket.count, 0), resetAt: bucket.resetAt };
};

export const clientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
};

export const MAX_BODY_BYTES = 64 * 1024;

export const tooLarge = (request: Request): boolean => {
  const length = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(length) && length > MAX_BODY_BYTES;
};

export const guard = (
  request: Request,
  scope: string,
  options: { limit: number; windowMs: number } = { limit: 24, windowMs: 10 * 60 * 1000 },
): NextResponse | null => {
  if (tooLarge(request)) {
    return NextResponse.json(
      { ok: false, error: { code: "payload_too_large", message: "That request was too large. Trim the pasted text and retry.", retryable: false } },
      { status: 413 },
    );
  }
  const result = rateLimit(`${scope}:${clientIp(request)}`, options);
  if (!result.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many AI requests from this browser. Try again in a few minutes.",
          retryable: true,
        },
      },
      { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } },
    );
  }
  return null;
};

/**
 * Structured logging that can never contain resume text: only task name,
 * provider ids, status codes and timings.
 */
export const logEvent = (event: {
  scope: string;
  ok: boolean;
  provider?: string;
  code?: string;
  latencyMs?: number;
  attempts?: number;
}): void => {
  if (process.env.NODE_ENV === "test") return;
  const payload = JSON.stringify({ at: new Date().toISOString(), ...event });
  console.log(`[ai] ${payload}`);
};

export const jsonError = (message: string, status = 400, code = "bad_request", help?: string) =>
  NextResponse.json({ ok: false, error: { code, message, retryable: false, ...(help ? { help } : {}) } }, { status });
