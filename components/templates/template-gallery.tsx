"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Search, SlidersHorizontal, X } from "lucide-react";
import { TEMPLATES, TEMPLATE_INDUSTRIES, TEMPLATE_LEVELS, TEMPLATE_STYLES, filterTemplates } from "@/lib/templates/registry";
import { TEMPLATE_CATEGORIES } from "@/types/template";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { ResumeThumb } from "@/components/resume/ResumeThumb";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export function TemplateGallery({ initialCategory = "all", initialSearch = "" }: { initialCategory?: string; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [industry, setIndustry] = useState("all");
  const [level, setLevel] = useState("all");
  const [style, setStyle] = useState("all");
  const [columns, setColumns] = useState<"all" | 1 | 2 | 3>("all");
  const [atsOnly, setAtsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(
    () =>
      filterTemplates({
        search,
        category: category as never,
        industry,
        level: level as never,
        style: style as never,
        columns,
        atsOnly,
      }),
    [search, category, industry, level, style, columns, atsOnly],
  );

  const activeFilters = [category !== "all", industry !== "all", level !== "all", style !== "all", columns !== "all", atsOnly].filter(Boolean).length;

  const reset = () => {
    setSearch("");
    setCategory("all");
    setIndustry("all");
    setLevel("all");
    setStyle("all");
    setColumns("all");
    setAtsOnly(false);
  };

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, industry or style" className="h-9 pl-8" />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-[5px] border px-3 text-[12.5px] font-medium transition-colors",
            showFilters || activeFilters ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong",
          )}
        >
          <SlidersHorizontal className="size-3.5" /> Filters
          {activeFilters ? <span className="rounded-full bg-accent px-1.5 text-[10px] text-white">{activeFilters}</span> : null}
        </button>
        <span className="ml-auto text-[12px] text-subtle">
          {results.length} of {TEMPLATES.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[{ id: "all", label: "All templates" }, ...TEMPLATE_CATEGORIES].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
              category === item.id ? "border-accent bg-accent-soft font-medium text-accent-ink" : "border-line text-subtle hover:border-line-strong hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showFilters ? (
        <div className="mt-3 grid gap-3 rounded-[8px] border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Industry" value={industry} onChange={setIndustry} options={TEMPLATE_INDUSTRIES.map((item) => ({ value: item, label: item }))} />
          <FilterSelect label="Experience level" value={level} onChange={setLevel} options={TEMPLATE_LEVELS.map((item) => ({ value: item, label: item }))} />
          <FilterSelect label="Style" value={style} onChange={setStyle} options={TEMPLATE_STYLES.map((item) => ({ value: item, label: item }))} />
          <FilterSelect
            label="Columns"
            value={String(columns)}
            onChange={(value) => setColumns(value === "all" ? "all" : (Number(value) as 1 | 2 | 3))}
            options={[
              { value: "1", label: "Single column" },
              { value: "2", label: "Two columns" },
              { value: "3", label: "Three columns" },
            ]}
          />
          <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-3">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-2">
              <input type="checkbox" checked={atsOnly} onChange={(event) => setAtsOnly(event.target.checked)} className="size-3.5 rounded-[3px] accent-[var(--color-accent)]" />
              ATS-safe only (score ≥ 90)
            </label>
            {activeFilters ? (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[12px] text-subtle hover:text-danger">
                <X className="size-3" /> Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {results.length === 0 ? (
        <div className="mt-10 rounded-[8px] border border-dashed border-line-strong py-16 text-center">
          <p className="text-[14px] font-medium text-ink">No templates match those filters</p>
          <p className="mt-1 text-[12.5px] text-subtle">Try clearing a filter — the library has 64 layouts.</p>
          <button type="button" onClick={reset} className="mt-3 text-[12.5px] font-medium text-accent hover:underline">
            Reset everything
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((template) => {
            const preview = buildTemplatePreview(template.id, "short");
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group flex flex-col overflow-hidden rounded-[9px] border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card)]"
              >
                <div className="relative bg-[#f2efe9] p-3">
                  <ResumeThumb doc={preview} template={template} width={240} className="mx-auto shadow-[0_4px_14px_-6px_rgba(21,23,27,0.3)]" />
                  <span className="absolute right-4 top-4">
                    <Badge tone={template.atsScore >= 90 ? "ok" : template.atsScore >= 78 ? "warn" : "danger"}>
                      {template.atsScore >= 90 ? "ATS-safe" : template.atsScore >= 78 ? "Mostly safe" : "Visual"}
                    </Badge>
                  </span>
                </div>
                <div className="flex flex-1 flex-col border-t border-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13.5px] font-semibold text-ink">{template.name}</h3>
                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-subtle">{template.tagline}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <Badge>{template.industry}</Badge>
                    <Badge>{template.columns === 1 ? "single column" : `${template.columns} columns`}</Badge>
                    <Badge>{template.pageSize === "a4" ? "A4" : "Letter"}</Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-10 rounded-[8px] border border-line bg-surface p-4">
        <h2 className="text-[13.5px] font-semibold text-ink">How the ATS rating is decided</h2>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-subtle">
          The rating reflects structural risk, not design quality: single-column layouts with standard section headings and simple
          typography score highest; tinted sidebars and multi-column grids score lower because parsers occasionally read them out of
          order. A low score is not a warning to avoid a template — it means “use this one when a person reads it first”.
        </p>
        <ul className="mt-2 grid gap-1 text-[12px] text-subtle sm:grid-cols-3">
          {[
            ["90–100", "Portal-safe: single column, standard headings"],
            ["78–89", "Mostly safe: simple two-column structure"],
            ["Below 78", "Visual layouts — best for direct applications"],
          ].map(([range, label]) => (
            <li key={range} className="flex items-center gap-1.5">
              <Check className="size-3 text-accent" />
              <span className="font-medium text-ink">{range}</span> {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[10.5px] font-medium uppercase tracking-[0.09em] text-subtle">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-[5px] border border-line bg-surface px-2 text-[12.5px] capitalize text-ink focus-visible:border-accent focus-visible:outline-none"
      >
        <option value="all">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="capitalize">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
