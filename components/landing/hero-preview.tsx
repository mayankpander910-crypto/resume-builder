"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GripVertical, MousePointer2 } from "lucide-react";
import { getTemplate } from "@/lib/templates/registry";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { ResumeThumb } from "@/components/resume/ResumeThumb";
import { cn } from "@/lib/utils/cn";

const SHOWCASE = [
  { id: "meridian", label: "Meridian" },
  { id: "flank", label: "Flank" },
  { id: "gazette", label: "Gazette" },
  { id: "launchpad", label: "Launchpad" },
];

export function HeroPreview() {
  const [active, setActive] = useState(SHOWCASE[0].id);
  const template = getTemplate(active);
  const doc = useMemo(() => buildTemplatePreview(active, "medium"), [active]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_1px_2px_rgba(21,23,27,0.05),0_24px_60px_-32px_rgba(21,23,27,0.35)]">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-3 py-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-[#e0ddd3]" />
            <span className="size-2 rounded-full bg-[#e0ddd3]" />
            <span className="size-2 rounded-full bg-[#e0ddd3]" />
          </span>
          <span className="ml-1 truncate text-[11px] text-subtle">aarav-mehta-senior-product-engineer.pdf</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-ok-soft px-1.5 py-0.5 text-[10px] font-medium text-ok">
            <Check className="size-2.5" /> ATS 97
          </span>
        </div>
        <div className="flex items-stretch gap-3 bg-[#f2efe9] p-3">
          <div className="hidden w-[92px] shrink-0 flex-col gap-1.5 sm:flex">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-subtle">Sections</p>
            {["Summary", "Experience", "Projects", "Education", "Skills"].map((label, index) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-1 rounded-[3px] border bg-white px-1.5 py-1 text-[9.5px] text-ink-2",
                  index === 1 ? "border-accent/40 ring-1 ring-accent/15" : "border-line",
                )}
              >
                <GripVertical className="size-2.5 text-subtle/60" />
                <span className="truncate">{label}</span>
              </div>
            ))}
            <div className="mt-1 rounded-[3px] border border-dashed border-line-strong px-1.5 py-1 text-[9px] text-subtle">
              + Add section
            </div>
          </div>
          <div className="relative flex-1">
            <ResumeThumb doc={doc} template={template} width={300} eager className="mx-auto !border-line-strong !shadow-[0_6px_18px_-8px_rgba(21,23,27,0.3)]" />
          </div>
        </div>
        <div className="flex items-center gap-1 border-t border-line bg-surface px-2 py-1.5">
          {SHOWCASE.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] transition-colors",
                active === item.id ? "bg-accent-soft font-medium text-accent-ink" : "text-subtle hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
          <Link href="/templates" className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-medium text-accent hover:underline">
            All 64 <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute -left-3 top-1/3 hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-[10.5px] font-medium text-ink-2 shadow-[var(--shadow-card)] lg:flex">
        <MousePointer2 className="size-3 text-accent" /> Drag any section
      </div>
      <div className="pointer-events-none absolute -right-2 bottom-16 hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-[10.5px] font-medium text-ink-2 shadow-[var(--shadow-card)] lg:flex">
        <span className="size-1.5 rounded-full bg-ok" /> Real content, not lorem
      </div>
    </div>
  );
}
