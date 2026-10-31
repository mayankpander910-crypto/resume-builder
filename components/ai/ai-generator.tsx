"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Info, Loader2, RefreshCw, Sparkles, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedResume } from "@/lib/ai/schemas";
import { aiGenerate, fetchAiStatus, type ProviderStatus } from "@/lib/ai/client";
import { generatedToSections } from "@/lib/ai/map-generated";
import { useResumeStore } from "@/store/resume-store";
import { applyTemplateToSections, getTemplate, templatePageSettings } from "@/lib/templates/registry";
import { parseResumeText } from "@/lib/resume/import/parse";
import { ACCEPTED_IMPORT_TYPES, extractTextFromFile, ImportError } from "@/lib/resume/import/extract";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const LEVELS = [
  { value: "student", label: "Student / final year" },
  { value: "fresher", label: "Fresher · under 1 year" },
  { value: "junior", label: "Junior · 1–3 years" },
  { value: "mid", label: "Mid-level · 3–6 years" },
  { value: "senior", label: "Senior · 6–10 years" },
  { value: "lead", label: "Lead / staff" },
  { value: "executive", label: "Executive" },
];

export function AiGenerator() {
  const router = useRouter();
  const doc = useResumeStore((state) => state.doc);
  const setDoc = useResumeStore((state) => state.setDoc);
  const persist = useResumeStore((state) => state.persist);
  const hydrate = useResumeStore((state) => state.hydrate);

  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [mode, setMode] = useState<"facts" | "raw">("facts");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResume | null>(null);
  const [meta, setMeta] = useState<{ provider: string; model: string; latencyMs: number } | null>(null);
  const [raw, setRaw] = useState("");
  const [importNote, setImportNote] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: doc.basics.fullName,
    email: doc.basics.email,
    phone: doc.basics.phone,
    location: doc.basics.location,
    linkedin: doc.basics.linkedin,
    website: doc.basics.website,
    targetRole: "",
    experienceLevel: "mid",
    facts: "",
  });

  useEffect(() => {
    hydrate();
    fetchAiStatus().then(setStatus);
  }, [hydrate]);

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleFile = async (file: File) => {
    setImportNote("Reading file…");
    try {
      const extracted = await extractTextFromFile(file);
      const parsed = parseResumeText(extracted.text);
      setRaw(extracted.text);
      setMode("raw");
      setImportNote(
        `Extracted ${extracted.text.split(/\s+/).length} words from ${file.name}. Detected ${parsed.experience.length} role(s) and ${parsed.skills.length} skill(s). Check the text below before generating.`,
      );
      setForm((current) => ({
        ...current,
        fullName: parsed.basics.fullName || current.fullName,
        email: parsed.basics.email || current.email,
        phone: parsed.basics.phone || current.phone,
        location: parsed.basics.location || current.location,
      }));
    } catch (error) {
      setImportNote(error instanceof ImportError ? error.message : "Could not read that file.");
    }
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    const response = await aiGenerate({
      mode: mode === "raw" ? "raw-text" : "full",
      targetRole: form.targetRole,
      experienceLevel: form.experienceLevel,
      basics: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        linkedin: form.linkedin,
        website: form.website,
      },
      facts: form.facts,
      rawText: mode === "raw" ? raw : undefined,
    });
    setBusy(false);
    if (!response.ok) {
      setError(response.error.message + (response.error.help ? ` ${response.error.help}` : ""));
      return;
    }
    setResult(response.data);
    setMeta({ provider: response.provider, model: response.model, latencyMs: response.latencyMs });
  };

  const apply = () => {
    if (!result) return;
    const sections = generatedToSections(result);
    const template = getTemplate(doc.meta.templateId);
    const nextSections = applyTemplateToSections({ ...doc, sections }, template);
    setDoc({
      ...doc,
      basics: {
        ...doc.basics,
        fullName: form.fullName || doc.basics.fullName,
        headline: result.headline || doc.basics.headline,
        email: form.email || doc.basics.email,
        phone: form.phone || doc.basics.phone,
        location: form.location || doc.basics.location,
        linkedin: form.linkedin || doc.basics.linkedin,
        website: form.website || doc.basics.website,
      },
      sections: nextSections,
      page: { ...doc.page, ...templatePageSettings(template) },
    });
    persist();
    toast.success("Resume generated — review every line before sending.");
    router.push("/builder");
  };

  const aiReady = status?.aiEnabled ?? false;
  const missing = result?.missingInformation ?? [];

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-4">
        {!aiReady ? (
          <div className="rounded-[8px] border border-warn/30 bg-warn-soft p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-warn">
              <AlertTriangle className="size-4" /> AI generation is not configured on this deployment
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-warn/90">
              The generator needs at least one provider key on the server: <code className="rounded bg-white/60 px-1">GEMINI_API_KEY</code>,{" "}
              <code className="rounded bg-white/60 px-1">GROQ_API_KEY</code>, <code className="rounded bg-white/60 px-1">OPENROUTER_API_KEY</code>,{" "}
              <code className="rounded bg-white/60 px-1">CEREBRAS_API_KEY</code> or <code className="rounded bg-white/60 px-1">HUGGINGFACE_API_KEY</code>. Add one
              to <code className="rounded bg-white/60 px-1">.env.local</code> and restart the server.
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-warn/90">
              Everything else is available right now: the editor, all 64 templates, import, ATS checks and PDF export.
            </p>
            <div className="mt-2.5 flex gap-2">
              <Link href="/builder?new=1" className="rounded-[5px] bg-warn px-3 py-1.5 text-[12.5px] font-medium text-white">
                Build manually instead
              </Link>
              <a href="/api/ai/status" target="_blank" rel="noreferrer" className="rounded-[5px] border border-warn/40 px-3 py-1.5 text-[12.5px] font-medium text-warn">
                Provider status
              </a>
            </div>
          </div>
        ) : null}

        <div className="rounded-[9px] border border-line bg-surface p-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "facts" | "raw")}>
            <TabsList>
              <TabsTrigger value="facts">Structured facts</TabsTrigger>
              <TabsTrigger value="raw">Paste or upload text</TabsTrigger>
            </TabsList>

            <TabsContent value="facts" className="mt-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Full name"><Input value={form.fullName} onChange={(event) => set("fullName")(event.target.value)} placeholder="Aarav Mehta" /></Field>
                <Field label="Target role"><Input value={form.targetRole} onChange={(event) => set("targetRole")(event.target.value)} placeholder="Senior backend engineer" /></Field>
                <Field label="Email"><Input value={form.email} onChange={(event) => set("email")(event.target.value)} placeholder="you@mail.com" /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={(event) => set("phone")(event.target.value)} /></Field>
                <Field label="Location"><Input value={form.location} onChange={(event) => set("location")(event.target.value)} placeholder="Ahmedabad, India" /></Field>
                <Field label="Experience level">
                  <Select value={form.experienceLevel} onValueChange={set("experienceLevel")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="LinkedIn"><Input value={form.linkedin} onChange={(event) => set("linkedin")(event.target.value)} placeholder="linkedin.com/in/you" /></Field>
                <Field label="Website / GitHub"><Input value={form.website} onChange={(event) => set("website")(event.target.value)} placeholder="yoursite.dev" /></Field>
              </div>
              <Field label="Your experience, in your own words">
                <Textarea
                  value={form.facts}
                  onChange={(event) => set("facts")(event.target.value)}
                  placeholder={"Example:\n2022–now, Northwind Labs, Senior Product Engineer — billing platform, led a pod of four. Rebuilt metering on an event ledger, invoice disputes down 38%.\n2019–2022, Fieldline, Product Engineer — scheduling engine, multi-timezone booking, page load p75 3.4s → 1.1s.\nSkills: TypeScript, Go, PostgreSQL, Kafka.\nEducation: B.Tech CSE, NIT Surathkal, 2017."}
                  style={{ minHeight: 200 }}
                />
              </Field>
              <p className="text-[11px] leading-relaxed text-subtle">
                Write dates, employers, titles and any real numbers here. The generator will not invent any of them — anything it cannot
                find is reported back as missing rather than filled in.
              </p>
            </TabsContent>

            <TabsContent value="raw" className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[5px] border border-line-strong px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2">
                  <Upload className="size-3.5" /> Upload PDF / DOCX / TXT
                  <input
                    type="file"
                    accept={ACCEPTED_IMPORT_TYPES}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                </label>
                <span className="text-[11px] text-subtle">Parsed in your browser — the file is never uploaded.</span>
              </div>
              {importNote ? <p className="rounded-[5px] bg-surface-2 px-2 py-1.5 text-[11.5px] leading-relaxed text-ink-2">{importNote}</p> : null}
              <Textarea
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                placeholder="Paste anything: an old resume, notes, a LinkedIn export. Unstructured is fine — it will be turned into sections."
                style={{ minHeight: 240 }}
              />
            </TabsContent>
          </Tabs>

          <Separator className="my-3" />

          <label className="flex cursor-pointer items-start gap-2">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 size-3.5 rounded-[3px] accent-[var(--color-accent)]" />
            <span className="text-[11px] leading-relaxed text-subtle">
              I consent to sending this text to an external AI provider configured by this deployment (currently:{" "}
              {status?.configured.length ? status.configured.join(", ") : "none"}). The provider processes it under its own terms. Nothing is stored on
              this server.
            </span>
          </label>

          <Button variant="primary" size="lg" className="mt-3 w-full" onClick={generate} disabled={!aiReady || !consent || busy || (mode === "raw" ? raw.trim().length < 60 : form.facts.trim().length < 40)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Writing your resume…" : "Generate resume content"}
          </Button>
          {error ? <p className="mt-2 rounded-[5px] bg-danger-soft px-2.5 py-2 text-[11.5px] leading-relaxed text-danger">{error}</p> : null}
        </div>

        <div className="rounded-[9px] border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
            <Info className="size-3.5 text-accent" /> What the generator will and will not do
          </p>
          <ul className="mt-1.5 grid gap-1 text-[12px] leading-relaxed text-subtle sm:grid-cols-2">
            {[
              "Will: organise your facts into standard sections.",
              "Will: tighten wording and lead bullets with verbs.",
              "Will not: invent employers, dates or degrees.",
              "Will not: add percentages or metrics you did not supply.",
              "Will not: claim skills you never mentioned.",
              "Will: tell you which facts are missing.",
            ].map((line) => (
              <li key={line} className="flex gap-1.5">
                <Check className="mt-0.5 size-3 shrink-0 text-accent" /> {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-[9px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-ink">Review before applying</p>
            {meta ? <Badge tone="ok">{meta.provider} · {(meta.latencyMs / 1000).toFixed(1)}s</Badge> : <Badge>draft</Badge>}
          </div>

          {!result ? (
            <div className="mt-3 rounded-[6px] border border-dashed border-line-strong px-3 py-8 text-center">
              <Wand2 className="mx-auto size-4 text-subtle" />
              <p className="mt-2 text-[12px] font-medium text-ink">Nothing generated yet</p>
              <p className="mt-1 text-[11px] leading-relaxed text-subtle">
                Fill in as much as you can, then generate. You will see every section here before anything touches your resume.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              <div className="flex flex-wrap gap-1">
                {[
                  ["Roles", result.experience.length],
                  ["Education", result.education.length],
                  ["Skill groups", result.skills.length],
                  ["Projects", result.projects.length],
                  ["Certifications", result.certifications.length],
                ].map(([label, count]) => (
                  <Badge key={String(label)} tone={Number(count) ? "accent" : "neutral"}>
                    {label}: {count}
                  </Badge>
                ))}
              </div>

              {result.headline ? (
                <div className="rounded-[5px] border border-line px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-[0.09em] text-subtle">Headline</p>
                  <p className="text-[12px] text-ink">{result.headline}</p>
                </div>
              ) : null}
              {result.summary ? (
                <div className="rounded-[5px] border border-line px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-[0.09em] text-subtle">Summary</p>
                  <p className="text-[12px] leading-relaxed text-ink-2">{result.summary}</p>
                </div>
              ) : null}
              {result.experience.slice(0, 2).map((role, index) => (
                <div key={index} className="rounded-[5px] border border-line px-2.5 py-2">
                  <p className="text-[12px] font-medium text-ink">
                    {role.role}
                    {role.company ? ` · ${role.company}` : ""}
                  </p>
                  <p className="text-[10.5px] text-subtle">{[role.startDate, role.endDate].filter(Boolean).join(" – ")}</p>
                  <ul className="mt-1 space-y-0.5">
                    {role.bullets.slice(0, 3).map((bullet, i) => (
                      <li key={i} className="text-[11px] leading-snug text-ink-2">
                        • {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {missing.length ? (
                <div className="rounded-[5px] border border-warn/30 bg-warn-soft px-2.5 py-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-warn">Missing facts</p>
                  <ul className="mt-1 space-y-0.5">
                    {missing.map((item, index) => (
                      <li key={index} className="text-[11px] leading-snug text-warn/90">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.followUpQuestions?.length ? (
                <div className="rounded-[5px] border border-line px-2.5 py-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">Worth answering</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {result.followUpQuestions.map((question, index) => (
                      <li key={index} className="text-[11px] leading-snug text-ink-2">
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex gap-1.5">
                <Button variant="primary" size="md" className="flex-1" onClick={apply}>
                  Apply &amp; open editor <ArrowRight className="size-3.5" />
                </Button>
                <Button variant="secondary" size="icon" onClick={generate} aria-label="Regenerate" disabled={busy}>
                  <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
                </Button>
              </div>
              <p className="text-[10.5px] leading-relaxed text-subtle">
                Applying replaces the sections in your current document. Your template and styling are kept, and the change is undoable
                with ⌘Z in the editor.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[9px] border border-line bg-surface p-4">
          <p className="text-[12.5px] font-semibold text-ink">Prefer to bring your own file?</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-subtle">
            Import a PDF or DOCX directly into the editor without any AI involvement. Extraction happens locally, and you approve each
            detected section.
          </p>
          <Link href="/builder?new=1" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
            Open the editor and import <ArrowRight className="size-3" />
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
