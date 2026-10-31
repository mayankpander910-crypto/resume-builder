"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Columns3, FileText, Layers, Printer, Type } from "lucide-react";
import type { ResumeTemplate } from "@/types/template";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Badge, ScoreRing } from "@/components/ui/misc";
import { FONT_LABELS, PAGE_SPECS } from "@/lib/resume/renderer/metrics";
import type { SampleLength } from "@/lib/content/sample-resume";
import { cn } from "@/lib/utils/cn";

export function TemplateDetail({ template }: { template: ResumeTemplate }) {
  const [length, setLength] = useState<SampleLength>("medium");
  const doc = useMemo(() => buildTemplatePreview(template.id, length), [template.id, length]);
  const router = useRouter();
  const applyTemplate = useResumeStore((state) => state.applyTemplate);
  const hydrate = useResumeStore((state) => state.hydrate);

  const useTemplate = () => {
    hydrate();
    applyTemplate(template.id);
    useResumeStore.getState().persist();
    router.push("/builder");
  };

  const facts = [
    { icon: Columns3, label: "Structure", value: template.columns === 1 ? "Single column" : `${template.columns} columns` },
    { icon: FileText, label: "Page", value: `${PAGE_SPECS[template.pageSize].label} · ${template.pageSize === "a4" ? "210 × 297 mm" : "8.5 × 11 in"}` },
    { icon: Type, label: "Typography", value: `${FONT_LABELS[template.theme.fontFamily]} · ${template.theme.nameSize}pt name` },
    { icon: Layers, label: "Best for", value: template.industry },
  ];

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link href="/templates" className="inline-flex items-center gap-1 text-[12.5px] text-subtle hover:text-ink">
            <ArrowLeft className="size-3.5" /> All templates
          </Link>
          <span className="text-subtle/40">/</span>
          <span className="text-[12.5px] text-ink">{template.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-[5px] border border-line p-0.5">
            {(["short", "medium", "long"] as SampleLength[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLength(option)}
                className={cn(
                  "rounded-[3px] px-2 py-1 text-[11.5px] capitalize transition-colors",
                  length === option ? "bg-accent-soft font-medium text-accent-ink" : "text-subtle hover:text-ink",
                )}
              >
                {option} resume
              </button>
            ))}
          </div>
          <span className="text-[11.5px] text-subtle">Rendered live — this is the actual output, not a screenshot.</span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[9px] border border-line bg-[#e9e6df] p-4">
          <div className="mx-auto w-fit">
            <ResumeCanvas doc={doc} template={template} mode="paged" zoom={0.82} />
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="text-eyebrow">{template.category}</p>
        <h1 className="mt-1.5 text-[26px] leading-tight">{template.name}</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-subtle">{template.tagline}</p>

        <div className="mt-4 flex items-center gap-3 rounded-[8px] border border-line bg-surface p-3">
          <ScoreRing value={template.atsScore} label="ATS" />
          <div>
            <p className="text-[12.5px] font-medium text-ink">{template.atsLabel}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-subtle">
              Our structural heuristic — single column and standard headings score highest.
            </p>
          </div>
        </div>

        <dl className="mt-3 divide-y divide-line rounded-[8px] border border-line bg-surface">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-start gap-2.5 px-3 py-2">
              <fact.icon className="mt-0.5 size-3.5 shrink-0 text-subtle" />
              <div className="min-w-0">
                <dt className="text-[10.5px] uppercase tracking-[0.09em] text-subtle">{fact.label}</dt>
                <dd className="truncate text-[12.5px] text-ink">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          <Button variant="primary" size="lg" onClick={useTemplate}>
            Use this template <ArrowRight />
          </Button>
          <Button asChild variant="secondary" size="md">
            <Link href="/builder">
              <Printer /> Open my current resume
            </Link>
          </Button>
        </div>

        <div className="mt-4 rounded-[8px] border border-line bg-surface p-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
            <Check className="size-3.5 text-accent" /> Your content is preserved
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-subtle">
            Applying a template replaces layout and styling only. Sections are re-ordered to the template&apos;s recommended sequence and
            everything stays editable — and undoable.
          </p>
        </div>

        <div className="mt-3 rounded-[8px] border border-line bg-surface p-3">
          <p className="text-[11.5px] font-medium text-ink">Section order in this template</p>
          <ol className="mt-1.5 space-y-0.5">
            {template.sectionOrder.slice(0, 8).map((kind, index) => (
              <li key={`${kind}-${index}`} className="flex items-center gap-1.5 text-[11.5px] text-subtle">
                <span className="w-3 text-right text-[10px] tabular-nums text-subtle/60">{index + 1}</span>
                <span className="capitalize text-ink-2">{kind === "custom" ? "Custom sections" : kind.replace("-", " ")}</span>
                {template.sidebarKinds.includes(kind) ? <span className="ml-auto text-[10px] text-accent">sidebar</span> : null}
              </li>
            ))}
            {template.sectionOrder.length > 8 ? (
              <li className="pl-[18px] text-[11px] text-subtle">+ {template.sectionOrder.length - 8} more</li>
            ) : null}
          </ol>
        </div>
      </aside>
    </div>
  );
}
