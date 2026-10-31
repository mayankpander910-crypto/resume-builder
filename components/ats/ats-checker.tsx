"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, CircleAlert, FileText, Info, Minimize2, Play, TriangleAlert, Upload, X } from "lucide-react";
import { analyzePlainText, analyzeResume, type AtsReport, type Check as AtsCheck } from "@/lib/ats/analyze";
import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { ACCEPTED_IMPORT_TYPES, extractTextFromFile, ImportError } from "@/lib/resume/import/extract";
import { resumeToPlainText } from "@/lib/resume/renderer/plain-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge, ScoreRing, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

type Mode = "mine" | "paste";

const STATUS_META = {
  pass: { icon: Check, className: "text-ok", chip: "ok" as const, label: "Pass" },
  warn: { icon: CircleAlert, className: "text-warn", chip: "warn" as const, label: "Improve" },
  fail: { icon: X, className: "text-danger", chip: "danger" as const, label: "Fix" },
  info: { icon: Info, className: "text-subtle", chip: "neutral" as const, label: "Note" },
};

export function AtsChecker() {
  const doc = useResumeStore((state) => state.doc);
  const hydrate = useResumeStore((state) => state.hydrate);
  const [mode, setMode] = useState<Mode>("mine");
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState<AtsReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const currentText = useMemo(() => resumeToPlainText(doc), [doc]);
  const wordCount = mode === "mine" ? currentText.split(/\s+/).filter(Boolean).length : text.split(/\s+/).filter(Boolean).length;

  const run = () => {
    setBusy(true);
    setNote(null);
    // Yield a frame so the button state paints before the synchronous analysis.
    requestAnimationFrame(() => {
      const next = mode === "mine" ? analyzeResume(doc, { jobDescription }) : analyzePlainText(text, { jobDescription });
      setReport(next);
      setBusy(false);
    });
  };

  const upload = async (file: File) => {
    setNote("Extracting text…");
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted.text);
      setNote(`${extracted.text.split(/\s+/).filter(Boolean).length} words extracted from ${file.name}. Nothing was uploaded.`);
    } catch (error) {
      setNote(error instanceof ImportError ? error.message : "That file could not be read.");
    }
  };

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="rounded-[9px] border border-line bg-surface p-4">
          <Tabs value={mode} onValueChange={(value) => { setMode(value as Mode); setReport(null); }}>
            <TabsList>
              <TabsTrigger value="mine">My resume</TabsTrigger>
              <TabsTrigger value="paste">Paste or upload</TabsTrigger>
            </TabsList>
            <TabsContent value="mine" className="mt-3">
              <div className="rounded-[6px] border border-line bg-surface-2 p-2.5">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                  <FileText className="size-3.5 text-subtle" /> {doc.meta.name || "Untitled resume"}
                </p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {wordCount} words · {doc.sections.length} sections · template “{getTemplate(doc.meta.templateId).name}”
                </p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-subtle">
                This reads the document in your local editor state, including the template you picked. Nothing is sent anywhere.
              </p>
              <Link href="/builder" className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                Edit it first <ArrowRight className="size-3" />
              </Link>
            </TabsContent>
            <TabsContent value="paste" className="mt-3 space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[5px] border border-line-strong px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2">
                <Upload className="size-3.5" /> Choose PDF / DOCX / TXT
                <input
                  type="file"
                  accept={ACCEPTED_IMPORT_TYPES}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
              </label>
              <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the full text of your resume…" style={{ minHeight: 160 }} />
              <p className="text-[11px] text-subtle">{wordCount} words {note ? `· ${note}` : ""}</p>
            </TabsContent>
          </Tabs>

          <Separator className="my-3" />

          <div className="space-y-1">
            <label className="flex items-center justify-between text-[11px] font-medium text-ink-2">
              <span>Job description (optional)</span>
              <span className="text-[10.5px] font-normal text-subtle">{jobDescription.trim() ? jobDescription.trim().split(/\s+/).length + " words" : "adds keyword matching"}</span>
            </label>
            <Textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the posting to compare against. Only used locally for keyword coverage."
              style={{ minHeight: 90 }}
            />
          </div>

          <Button variant="primary" size="lg" className="mt-3 w-full" onClick={run} disabled={busy || (mode === "paste" && text.trim().length < 60)}>
            {busy ? <Minimize2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {busy ? "Checking…" : "Run the check"}
          </Button>
        </div>

        <div className="rounded-[9px] border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <TriangleAlert className="size-3.5 text-warn" /> What this score is
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-subtle">
            A rule-based review of the things that most often break automated screening: unparseable contact details, missing sections,
            weak bullet structure, keyword gaps and risky layouts. It is <strong className="text-ink">not</strong> an employer&apos;s ATS score
            and no real ATS was involved. Treat it as a checklist, not a verdict.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        {!report ? (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[9px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
            <ScoreRing value={0} size={72} label="—" />
            <p className="mt-3 text-[14px] font-semibold text-ink">No report yet</p>
            <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-subtle">
              Run the check to see up to eighteen automated checks, section quality and bullet-level issues. Results stay in
              your browser.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[9px] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-4">
                <ScoreRing value={report.score} size={86} label="score" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={report.score >= 85 ? "ok" : report.score >= 70 ? "warn" : "danger"}>{report.band}</Badge>
                    <span className="text-[11.5px] text-subtle">
                      {report.checks.filter((check) => check.status === "pass").length} passed ·{" "}
                      {report.checks.filter((check) => check.status === "warn").length} to improve ·{" "}
                      {report.checks.filter((check) => check.status === "fail").length} to fix
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                    {[
                      ["Words", report.stats.words],
                      ["Bullets", report.stats.bullets],
                      ["Quantified", `${report.stats.quantifiedBullets}`],
                      ["Avg bullet", `${report.stats.avgBulletWords}w`],
                      ["Pages", report.stats.estimatedPages],
                      ["Template ATS", report.stats.atsTemplateScore],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <p className="text-[10px] uppercase tracking-[0.08em] text-subtle">{label}</p>
                        <p className="text-[13px] font-medium text-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 rounded-[5px] bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-subtle">{report.disclaimer}</p>
            </div>

            {report.recommendations.length ? (
              <div className="rounded-[9px] border border-line bg-surface p-4">
                <p className="text-[12.5px] font-semibold text-ink">Do these first</p>
                <ol className="mt-1.5 space-y-1">
                  {report.recommendations.slice(0, 6).map((item, index) => (
                    <li key={index} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-2">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="rounded-[9px] border border-line bg-surface p-4">
              <p className="text-[12.5px] font-semibold text-ink">Checks</p>
              <div className="mt-2 divide-y divide-line">
                {report.checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[9px] border border-line bg-surface p-4">
                <p className="text-[12.5px] font-semibold text-ink">Sections</p>
                <div className="mt-2 space-y-1.5">
                  {report.sections.map((section) => (
                    <div key={section.name} className="flex items-start gap-2">
                      <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", section.present ? (section.quality >= 70 ? "bg-ok" : "bg-warn") : "bg-danger")} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-ink">
                          {section.name}
                          {section.present ? <span className="ml-1 text-[10.5px] font-normal text-subtle">quality {section.quality}</span> : <span className="ml-1 text-[10.5px] font-normal text-danger">missing</span>}
                        </p>
                        {section.notes.length ? <p className="text-[11px] leading-snug text-subtle">{section.notes[0]}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[9px] border border-line bg-surface p-4">
                <p className="text-[12.5px] font-semibold text-ink">Bullet issues</p>
                {report.bulletIssues.length ? (
                  <div className="mt-2 max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                    {report.bulletIssues.map((issue, index) => (
                      <div key={index} className="rounded-[5px] border border-line px-2 py-1.5">
                        <p className="line-clamp-2 text-[11.5px] leading-snug text-ink-2">{issue.text}</p>
                        <p className="mt-0.5 text-[10.5px] text-warn">{issue.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ok">
                    <Check className="size-3.5" /> No structural bullet problems found.
                  </p>
                )}
              </div>
            </div>

            {report.keywords ? (
              <div className="rounded-[9px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-ink">Keyword coverage against the posting</p>
                  <Badge tone={report.keywords.coverage >= 70 ? "ok" : report.keywords.coverage >= 45 ? "warn" : "danger"}>{report.keywords.coverage}% matched</Badge>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Found in your resume</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {report.keywords.matched.length ? report.keywords.matched.map((term) => <Badge key={term} tone="ok">{term}</Badge>) : <span className="text-[11px] text-subtle">None yet</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">In the posting, not in yours</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {report.keywords.missing.length ? report.keywords.missing.map((term) => <Badge key={term} tone="warn">{term}</Badge>) : <span className="text-[11px] text-ok">Full coverage</span>}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-subtle">
                  Only add a missing term if it is genuinely true of your experience. Keyword stuffing is detected by reviewers and by
                  more sophisticated screening tools.
                </p>
              </div>
            ) : null}

            {report.strengths.length ? (
              <div className="rounded-[9px] border border-ok/25 bg-ok-soft p-4">
                <p className="text-[12.5px] font-semibold text-ok">What is working</p>
                <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                  {report.strengths.map((item) => (
                    <li key={item} className="flex gap-1.5 text-[11.5px] leading-relaxed text-ok/90">
                      <Check className="mt-0.5 size-3 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 rounded-[9px] border border-line bg-surface p-3">
              <AlertCircle className="size-4 shrink-0 text-subtle" />
              <p className="flex-1 text-[11.5px] text-subtle">Fix the flagged items directly in the editor, then re-run this check.</p>
              <Link href="/builder" className="inline-flex items-center gap-1 rounded-[5px] bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-accent-hover">
                Open editor <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: AtsCheck }) {
  const meta = STATUS_META[check.status];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", meta.className)} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-ink">{check.label}</p>
        <p className="text-[11px] leading-snug text-subtle">{check.detail}</p>
      </div>
      <Badge tone={meta.chip}>{meta.label}</Badge>
    </div>
  );
}
