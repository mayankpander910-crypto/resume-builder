"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, FileText, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/store/resume-store";
import { applyTemplateToSections, filterTemplates, getTemplate, templatePageSettings } from "@/lib/templates/registry";
import { TEMPLATE_CATEGORIES } from "@/types/template";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { ResumeThumb } from "@/components/resume/ResumeThumb";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";
import { parseResumeText, parsedToSections, type ParsedSelection } from "@/lib/resume/import/parse";
import { ACCEPTED_IMPORT_TYPES, extractTextFromFile, ImportError } from "@/lib/resume/import/extract";
import type { ResumeTemplate } from "@/types/template";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------ template picker */

export function TemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const doc = useResumeStore((state) => state.doc);
  const applyTemplate = useResumeStore((state) => state.applyTemplate);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const results = useMemo(
    () => filterTemplates({ search: query, category: category as never }),
    [query, category],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide
        className="max-w-5xl p-0"
        title="Choose a template"
        description="Your content stays exactly as it is — only the layout and styling change. You can undo this."
      >
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 64 templates" className="pl-7" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[{ id: "all", label: "All" }, ...TEMPLATE_CATEGORIES].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                  category === item.id ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-subtle hover:border-line-strong",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid max-h-[58vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={doc.meta.templateId === template.id}
              onSelect={() => {
                applyTemplate(template.id);
                onOpenChange(false);
                toast.success(`${template.name} applied — content preserved.`);
              }}
            />
          ))}
          {results.length === 0 ? (
            <p className="col-span-full py-10 text-center text-[12.5px] text-subtle">No templates match “{query}”.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ template, selected, onSelect }: { template: ResumeTemplate; selected: boolean; onSelect: () => void }) {
  const preview = useMemo(() => buildTemplatePreview(template.id, "short"), [template.id]);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-1.5 rounded-[7px] border p-1.5 text-left transition-all",
        selected ? "border-accent ring-2 ring-accent/15" : "border-line hover:border-line-strong hover:shadow-[var(--shadow-card)]",
      )}
    >
      <div className="relative overflow-hidden rounded-[3px]">
        <ResumeThumb doc={preview} template={template} width={196} fade={false} />
        {selected ? (
          <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-accent text-white">
            <Check className="size-3" />
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[12px] font-medium text-ink">{template.name}</span>
        <span className="shrink-0 text-[10px] text-subtle">ATS {template.atsScore}</span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------- import dialog */

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const setDoc = useResumeStore((state) => state.setDoc);
  const doc = useResumeStore((state) => state.doc);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selection, setSelection] = useState<ParsedSelection>({
    basics: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    achievements: true,
  });
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const parsed = useMemo(() => (text.trim().length > 20 ? parseResumeText(text) : null), [text]);

  // A file picked on the /import page is extracted there and handed over through
  // sessionStorage so the dialog opens already populated.
  useEffect(() => {
    if (!open) return;
    try {
      const pending = sessionStorage.getItem("rf:import-text");
      if (pending && pending.trim().length > 20) {
        setText(pending);
        setSource("file chosen on the import page");
        sessionStorage.removeItem("rf:import-text");
      }
    } catch {
      /* storage can be blocked; the dialog still works */
    }
  }, [open]);

  const handleFile = async (file: File) => {
    setBusy(true);
    setWarnings([]);
    try {
      const result = await extractTextFromFile(file);
      setText(result.text);
      setSource(file.name);
      setWarnings(result.warnings);
    } catch (error) {
      if (error instanceof ImportError) setWarnings([error.message]);
      else setWarnings([(error as Error).message]);
    } finally {
      setBusy(false);
    }
  };

  const applyImport = () => {
    if (!parsed) return;
    const sections = parsedToSections(parsed, selection);
    if (sections.length === 0) {
      toast.error("Nothing selected to import.");
      return;
    }
    const template = getTemplate(doc.meta.templateId);
    const nextSections = mode === "replace" ? sections : [...doc.sections, ...sections];
    setDoc({
      ...doc,
      basics: selection.basics ? { ...doc.basics, ...parsed.basics, photoVisible: doc.basics.photoVisible } : doc.basics,
      sections: applyTemplateToSections({ ...doc, sections: nextSections }, { ...template, sectionOrder: template.sectionOrder }),
      page: { ...doc.page, ...templatePageSettings(template) },
    });
    onOpenChange(false);
    toast.success(`Imported ${sections.length} sections from ${source || "pasted text"}. Check each one.`);
    setText("");
    setSource("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide
        title="Import an existing resume"
        description="Files are read in your browser — nothing is uploaded. Text extraction is best-effort: columns, tables and text boxes rarely survive."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-line-strong bg-surface-2/40 px-4 py-7 text-center"
            >
              <Upload className="size-5 text-subtle" />
              <p className="text-[12.5px] font-medium text-ink">Drop a PDF, DOCX or TXT file</p>
              <p className="text-[11px] text-subtle">Up to 8 MB. Processed locally.</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_IMPORT_TYPES}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
                {busy ? "Reading…" : "Choose a file"}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.09em] text-subtle">…or paste the text</p>
              <textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setSource("");
                }}
                placeholder="Paste your current resume as plain text and we will try to rebuild the sections."
                className="h-36 w-full resize-none rounded-[5px] border border-line bg-surface px-2.5 py-2 text-[12px] leading-relaxed focus-visible:border-accent focus-visible:outline-none"
              />
            </div>
            {warnings.length ? (
              <ul className="space-y-1 rounded-[5px] bg-warn-soft px-2 py-1.5">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex gap-1.5 text-[11px] leading-snug text-warn">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {warning}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.09em] text-subtle">What we found</p>
            {!parsed ? (
              <div className="rounded-[6px] border border-dashed border-line-strong px-3 py-8 text-center">
                <FileText className="mx-auto size-4 text-subtle" />
                <p className="mt-2 text-[11.5px] text-subtle">Add a file or paste text to see the extracted structure.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge tone="accent">Confidence {parsed.confidence}%</Badge>
                  <span className="text-[11px] text-subtle">{parsed.detected.length} headings recognised</span>
                </div>
                <div className="space-y-1 rounded-[6px] border border-line px-2.5 py-2 text-[11.5px]">
                  <Row label="Name" value={parsed.basics.fullName} />
                  <Row label="Email" value={parsed.basics.email} />
                  <Row label="Phone" value={parsed.basics.phone} />
                  <Row label="Summary" value={parsed.summary ? `${parsed.summary.split(/\s+/).length} words` : ""} />
                  <Row label="Roles" value={parsed.experience.length ? `${parsed.experience.length}` : ""} />
                  <Row label="Education" value={parsed.education.length ? `${parsed.education.length}` : ""} />
                  <Row label="Skills" value={parsed.skills.length ? `${parsed.skills.length} found` : ""} />
                  <Row label="Projects" value={parsed.projects.length ? `${parsed.projects.length}` : ""} />
                </div>
                <div className="space-y-1">
                  {(
                    [
                      ["basics", "Contact details"],
                      ["summary", "Summary"],
                      ["experience", "Work experience"],
                      ["education", "Education"],
                      ["skills", "Skills"],
                      ["projects", "Projects"],
                      ["certifications", "Certifications"],
                      ["achievements", "Achievements"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 text-[11.5px] text-ink-2">
                      <input
                        type="checkbox"
                        checked={selection[key]}
                        onChange={(event) => setSelection((current) => ({ ...current, [key]: event.target.checked }))}
                        className="size-3.5 rounded-[3px] accent-[var(--color-accent)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {parsed.unmapped.length ? (
                  <p className="rounded-[5px] bg-warn-soft px-2 py-1.5 text-[10.5px] leading-snug text-warn">
                    {parsed.unmapped.length} block(s) could not be classified and will be skipped: {parsed.unmapped[0].lines[0]?.slice(0, 60)}…
                  </p>
                ) : null}
                <div className="flex gap-1.5">
                  {(["replace", "append"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={cn(
                        "flex-1 rounded-[5px] border px-2 py-1.5 text-[11.5px] capitalize transition-colors",
                        mode === option ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-subtle",
                      )}
                    >
                      {option} content
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="sm" className="w-full" onClick={applyImport}>
                  Import into editor
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-subtle">{label}</span>
      <span className={cn("truncate text-right", value ? "text-ink" : "text-subtle/60")}>{value || "not found"}</span>
    </div>
  );
}

export { X };
