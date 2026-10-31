"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clipboard,
  ExternalLink,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { ImprovedText, ReviewResult, TailorResult } from "@/lib/ai/schemas";
import { aiImprove, aiReview, aiTailor, fetchAiStatus, type ProviderStatus } from "@/lib/ai/client";
import { useResumeStore } from "@/store/resume-store";
import { resumeToPromptText } from "@/lib/resume/renderer/plain-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge, Separator, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export interface AiTarget {
  sectionId: string;
  target: "summary" | "experience" | "project" | "skills" | "education" | "achievement";
  text: string;
  label: string;
  itemId?: string;
}

interface AiPanelProps {
  target: AiTarget | null;
  onClose: () => void;
  onApply: (payload: { sectionId: string; itemId?: string; mode: "text" | "bullets"; text: string; bullets: string[] }) => void;
}

const ACTIONS: { id: string; label: string; hint: string }[] = [
  { id: "improve", label: "Improve writing", hint: "Clearer, more specific, same facts" },
  { id: "bullets", label: "Make bullet points", hint: "Turns prose into 3–5 scannable bullets" },
  { id: "concise", label: "Make concise", hint: "Cuts length by roughly 40%" },
  { id: "grammar", label: "Fix grammar", hint: "Grammar, tense and punctuation only" },
  { id: "tone", label: "Professional tone", hint: "Removes clichés and hedging" },
];

export function AiPanel({ target, onClose, onApply }: AiPanelProps) {
  const doc = useResumeStore((state) => state.doc);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<null | "improve" | "review" | "tailor">(null);
  const [action, setAction] = useState("improve");
  const [result, setResult] = useState<ImprovedText | { bullets: string[] } | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [tailor, setTailor] = useState<TailorResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [meta, setMeta] = useState<{ provider: string; model: string; latencyMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAiStatus().then(setStatus);
  }, []);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [target?.sectionId, target?.itemId]);

  const aiReady = status?.aiEnabled ?? false;

  const runImprove = useCallback(async () => {
    if (!target) return;
    setBusy("improve");
    setError(null);
    setResult(null);
    const response = await aiImprove({
      action,
      target: target.target,
      content: target.text,
      context: resumeToPromptText(doc, 2400),
    });
    setBusy(null);
    if (!response.ok) {
      setError(response.error.message + (response.error.help ? ` ${response.error.help}` : ""));
      return;
    }
    setResult(response.data as ImprovedText | { bullets: string[] });
    setMeta({ provider: response.provider, model: response.model, latencyMs: response.latencyMs });
  }, [action, doc, target]);

  const runReview = useCallback(async () => {
    setBusy("review");
    setError(null);
    setReview(null);
    const response = await aiReview({ resume: doc });
    setBusy(null);
    if (!response.ok) {
      setError(response.error.message + (response.error.help ? ` ${response.error.help}` : ""));
      return;
    }
    setReview(response.data);
    setMeta({ provider: response.provider, model: response.model, latencyMs: response.latencyMs });
  }, [doc]);

  const runTailor = useCallback(async () => {
    if (jobDescription.trim().length < 40) {
      setError("Paste at least a few lines of the job description first.");
      return;
    }
    setBusy("tailor");
    setError(null);
    setTailor(null);
    const response = await aiTailor({ resume: doc, jobDescription });
    setBusy(null);
    if (!response.ok) {
      setError(response.error.message + (response.error.help ? ` ${response.error.help}` : ""));
      return;
    }
    setTailor(response.data);
    setMeta({ provider: response.provider, model: response.model, latencyMs: response.latencyMs });
  }, [doc, jobDescription]);

  const improvedText = result && "improved" in result ? result.improved : null;
  const bullets = result && "bullets" in result ? result.bullets : null;

  return (
    <aside className="flex h-full w-full flex-col border-l border-line bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-[4px] bg-accent-soft text-accent-ink">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold leading-tight text-ink">AI assistant</p>
            <p className="text-[10.5px] leading-tight text-subtle">Suggests. Never invents.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-ink" aria-label="Close AI assistant">
          <X className="size-4" />
        </button>
      </header>

      {!aiReady ? (
        <div className="border-b border-line bg-warn-soft px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-warn">
            <AlertTriangle className="size-3.5" /> No AI provider configured
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-warn/90">
            Add <code className="rounded bg-white/60 px-1">GEMINI_API_KEY</code> (or{" "}
            <code className="rounded bg-white/60 px-1">GROQ_API_KEY</code> / <code className="rounded bg-white/60 px-1">OPENROUTER_API_KEY</code>) to{" "}
            <code className="rounded bg-white/60 px-1">.env.local</code> and restart. Everything else — editing, templates, PDF export, ATS checks — works without it.
          </p>
          <a href="/api/ai/status" target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-warn underline">
            Check provider status <ExternalLink className="size-3" />
          </a>
        </div>
      ) : null}

      <Tabs defaultValue="improve" className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pt-2.5">
          <TabsList className="w-full">
            <TabsTrigger value="improve" className="flex-1 justify-center">
              <Wand2 className="size-3" /> Improve
            </TabsTrigger>
            <TabsTrigger value="tailor" className="flex-1 justify-center">
              <Target className="size-3" /> Tailor
            </TabsTrigger>
            <TabsTrigger value="review" className="flex-1 justify-center">
              <Clipboard className="size-3" /> Review
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="editor-panel min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
          {/* consent gate */}
          <label className="mb-3 flex cursor-pointer items-start gap-2 rounded-[6px] border border-line bg-surface-2/60 p-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-3.5 rounded-[3px] accent-[var(--color-accent)]"
            />
            <span className="text-[10.5px] leading-relaxed text-subtle">
              <span className="flex items-center gap-1 font-medium text-ink">
                <ShieldCheck className="size-3 text-accent" /> I consent to sending this content to an external AI provider
              </span>
              Only the text needed for this action is sent, never your whole browser storage. Providers process it under their own
              privacy policies. Nothing is stored on our server and requests are never logged with your content.
            </span>
          </label>

          <TabsContent value="improve" className="mt-0 space-y-3">
            {target ? (
              <>
                <div className="rounded-[6px] border border-line bg-surface px-2.5 py-2">
                  <p className="text-[10.5px] uppercase tracking-[0.09em] text-subtle">Selected</p>
                  <p className="truncate text-[12px] font-medium text-ink">{target.label}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-subtle">{target.text || "Empty — add a sentence first."}</p>
                </div>
                <div className="grid gap-1">
                  {ACTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAction(option.id)}
                      className={cn(
                        "flex items-start justify-between gap-2 rounded-[5px] border px-2 py-1.5 text-left transition-colors",
                        action === option.id ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong",
                      )}
                    >
                      <span>
                        <span className="block text-[12px] font-medium text-ink">{option.label}</span>
                        <span className="block text-[10.5px] text-subtle">{option.hint}</span>
                      </span>
                      {action === option.id ? <Check className="mt-0.5 size-3.5 text-accent" /> : null}
                    </button>
                  ))}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={!aiReady || !consent || busy !== null || !target.text.trim()}
                  onClick={runImprove}
                >
                  {busy === "improve" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  {busy === "improve" ? "Working…" : "Generate suggestion"}
                </Button>
              </>
            ) : (
              <div className="rounded-[6px] border border-dashed border-line-strong px-3 py-6 text-center">
                <Sparkles className="mx-auto size-4 text-subtle" />
                <p className="mt-2 text-[12px] font-medium text-ink">Pick a section to improve</p>
                <p className="mt-1 text-[11px] leading-relaxed text-subtle">
                  Open a section in the left panel and press “Improve with AI”, or use the Review tab for feedback on the whole resume.
                </p>
              </div>
            )}

            {error ? (
              <p className="rounded-[5px] border border-danger/20 bg-danger-soft px-2 py-1.5 text-[11px] leading-relaxed text-danger">{error}</p>
            ) : null}

            {improvedText || bullets ? (
              <div className="space-y-2">
                <Separator />
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-subtle">
                  <Sparkles className="size-3 text-accent" /> Suggestion
                  {meta ? <span className="ml-auto normal-case tracking-normal text-subtle/80">{meta.provider} · {(meta.latencyMs / 1000).toFixed(1)}s</span> : null}
                </p>
                <div className="whitespace-pre-wrap rounded-[6px] border border-accent/25 bg-accent-soft/40 px-2.5 py-2 text-[12px] leading-relaxed text-ink">
                  {improvedText ?? bullets?.map((bullet, index) => <div key={index}>• {bullet}</div>)}
                </div>
                {result && "changes" in result && result.changes.length ? (
                  <ul className="space-y-1">
                    {result.changes.map((change, index) => (
                      <li key={index} className="flex gap-1.5 text-[11px] leading-snug text-subtle">
                        <ArrowRight className="mt-0.5 size-3 shrink-0 text-accent" /> {change}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {result && "warnings" in result && result.warnings.length ? (
                  <ul className="space-y-1 rounded-[5px] bg-warn-soft px-2 py-1.5">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="text-[11px] leading-snug text-warn">
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {result && "needsMoreInfo" in result && result.needsMoreInfo.length ? (
                  <div className="rounded-[5px] border border-line px-2 py-1.5">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-subtle">Missing details</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {result.needsMoreInfo.map((item, index) => (
                        <li key={index} className="text-[11px] leading-snug text-subtle">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="flex gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (!target) return;
                      if (bullets) {
                        onApply({ sectionId: target.sectionId, itemId: target.itemId, mode: "bullets", text: "", bullets });
                        toast.success("Bullets inserted. Review them before you send it.");
                      } else if (improvedText) {
                        onApply({ sectionId: target.sectionId, itemId: target.itemId, mode: "text", text: improvedText, bullets: [] });
                        toast.success("Applied. You can undo with ⌘Z.");
                      }
                      setResult(null);
                    }}
                  >
                    <Check className="size-3.5" /> Insert into resume
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setResult(null)}>
                    Discard
                  </Button>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="tailor" className="mt-0 space-y-3">
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.09em] text-subtle">Job description</p>
              <Textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the posting here. More text gives a better comparison."
                style={{ minHeight: 140 }}
                className="text-[12px]"
              />
            </div>
            <Button variant="primary" size="sm" className="w-full" disabled={!aiReady || !consent || busy !== null} onClick={runTailor}>
              {busy === "tailor" ? <Loader2 className="size-3.5 animate-spin" /> : <Target className="size-3.5" />}
              {busy === "tailor" ? "Comparing…" : "Compare with my resume"}
            </Button>
            {error ? <p className="rounded-[5px] bg-danger-soft px-2 py-1.5 text-[11px] text-danger">{error}</p> : null}
            {tailor ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-subtle">Keyword match</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${tailor.matchScore ?? 0}%` }} />
                  </div>
                  <span className="text-[11px] font-medium tabular-nums text-ink">{tailor.matchScore ?? "–"}%</span>
                </div>
                {tailor.matchedKeywords.length ? (
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase tracking-[0.08em] text-subtle">Already covered</p>
                    <div className="flex flex-wrap gap-1">
                      {tailor.matchedKeywords.slice(0, 18).map((keyword) => (
                        <Badge key={keyword} tone="ok">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {tailor.missingKeywords.length ? (
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase tracking-[0.08em] text-subtle">Not mentioned</p>
                    <div className="flex flex-wrap gap-1">
                      {tailor.missingKeywords.slice(0, 18).map((keyword) => (
                        <Badge key={keyword} tone="warn">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-1 text-[10.5px] leading-snug text-subtle">Add only the ones that are true for you.</p>
                  </div>
                ) : null}
                {tailor.summaryRewrite ? (
                  <div className="rounded-[6px] border border-line px-2.5 py-2">
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Suggested summary</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-ink">{tailor.summaryRewrite}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-1.5"
                      onClick={() => {
                        const summary = doc.sections.find((section) => section.kind === "summary");
                        if (!summary) {
                          toast.error("Add a summary section first.");
                          return;
                        }
                        onApply({ sectionId: summary.id, mode: "text", text: tailor.summaryRewrite, bullets: [] });
                        toast.success("Summary replaced. Undo is available.");
                      }}
                    >
                      Use this summary
                    </Button>
                  </div>
                ) : null}
                {tailor.suggestions.map((suggestion, index) => (
                  <div key={index} className="rounded-[6px] border border-line px-2.5 py-2">
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">{suggestion.section || "Suggestion"}</p>
                    {suggestion.current ? <p className="mt-1 text-[11px] leading-snug text-subtle line-through">{suggestion.current}</p> : null}
                    <p className="mt-1 text-[11.5px] leading-relaxed text-ink">{suggestion.suggested}</p>
                    {suggestion.rationale ? <p className="mt-1 text-[10.5px] italic text-subtle">{suggestion.rationale}</p> : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-6 px-1.5 text-[11px]"
                      onClick={() => {
                        navigator.clipboard?.writeText(suggestion.suggested);
                        toast.success("Copied — paste it into the section you want to change.");
                      }}
                    >
                      Copy wording
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="review" className="mt-0 space-y-3">
            <p className="text-[11px] leading-relaxed text-subtle">
              A recruiter-style review of structure, clarity, relevance and phrasing, plus what to ask yourself. Suggestions never add facts.
            </p>
            <Button variant="primary" size="sm" className="w-full" disabled={!aiReady || !consent || busy !== null} onClick={runReview}>
              {busy === "review" ? <Loader2 className="size-3.5 animate-spin" /> : <Clipboard className="size-3.5" />}
              {busy === "review" ? "Reviewing…" : "Review my resume"}
            </Button>
            {error ? <p className="rounded-[5px] bg-danger-soft px-2 py-1.5 text-[11px] text-danger">{error}</p> : null}
            {review ? (
              <div className="space-y-2.5">
                {review.overallScore !== undefined ? (
                  <div className="flex items-center gap-2 rounded-[6px] bg-surface-2 px-2.5 py-2">
                    <span className="text-[19px] font-semibold tabular-nums text-ink">{review.overallScore}</span>
                    <span className="text-[11px] text-subtle">/ 100 AI review</span>
                  </div>
                ) : null}
                {review.summary ? <p className="text-[11.5px] leading-relaxed text-ink-2">{review.summary}</p> : null}
                {review.strengths.length ? (
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase tracking-[0.08em] text-subtle">Working well</p>
                    <ul className="space-y-1">
                      {review.strengths.map((strength, index) => (
                        <li key={index} className="flex gap-1.5 text-[11px] leading-snug text-ink-2">
                          <Check className="mt-0.5 size-3 shrink-0 text-ok" /> {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {review.issues.map((issue, index) => (
                  <div key={index} className="rounded-[6px] border border-line px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <Badge tone={issue.severity === "high" ? "danger" : issue.severity === "medium" ? "warn" : "neutral"}>{issue.severity}</Badge>
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">{issue.section}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] font-medium leading-snug text-ink">{issue.problem}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{issue.suggestion}</p>
                    {issue.replacement ? (
                      <div className="mt-1.5 rounded-[4px] bg-surface-2 px-2 py-1.5 text-[11px] leading-relaxed text-ink">
                        {issue.replacement}
                        <button
                          type="button"
                          className="mt-1 block text-[10.5px] font-medium text-accent hover:underline"
                          onClick={() => {
                            navigator.clipboard?.writeText(issue.replacement ?? "");
                            toast.success("Copied.");
                          }}
                        >
                          Copy replacement
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {review.questions.length ? (
                  <div className="rounded-[6px] border border-line px-2.5 py-2">
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Worth answering</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {review.questions.map((question, index) => (
                        <li key={index} className="text-[11px] leading-snug text-ink-2">
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </TabsContent>
        </div>
      </Tabs>

      <footer className="border-t border-line px-3.5 py-2">
        <p className="flex items-center gap-1.5 text-[10px] leading-relaxed text-subtle">
          <Info className="size-3 shrink-0" />
          {status && status.configured.length
            ? `Fallback chain: ${status.order.filter((id) => status.configured.includes(id)).join(" → ")}`
            : "AI is optional. The editor never depends on it."}
        </p>
      </footer>
    </aside>
  );
}
