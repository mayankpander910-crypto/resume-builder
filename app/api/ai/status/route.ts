import { NextResponse } from "next/server";
import { getProviderHealth } from "@/lib/ai/orchestrator";
import { PROVIDERS, configuredProviders, resolveProviderOrder } from "@/lib/ai/providers/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports which providers are configured and their health, without ever
 * exposing key material. Used by the AI assistant to explain why a feature is
 * unavailable instead of failing silently.
 */
export async function GET() {
  const order = resolveProviderOrder();
  const configured = configuredProviders();
  const health = getProviderHealth();
  return NextResponse.json({
    ok: true,
    aiEnabled: configured.length > 0,
    configured,
    order,
    providers: order.map((id) => {
      const config = PROVIDERS[id];
      const state = health.find((h) => h.provider === id);
      return {
        id,
        label: config.label,
        configured: configured.includes(id),
        model: config.model,
        docsUrl: config.docsUrl,
        freeTier: config.freeTier,
        requests: state?.requests ?? 0,
        successes: state?.successes ?? 0,
        failures: state?.failures ?? 0,
        lastErrorCode: state?.lastErrorCode,
        lastLatencyMs: state?.lastLatencyMs,
      };
    }),
    note: configured.length
      ? "Keys are read server-side only and never shipped to the browser."
      : "No provider keys are configured. The editor, templates, ATS heuristics and PDF export all work without AI.",
  });
}
