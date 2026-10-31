import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { EXAMPLES } from "@/lib/content/examples";
import { getTemplate } from "@/lib/templates/registry";
import { ResumeThumb } from "@/components/resume/ResumeThumb";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Resume examples",
  description: "Worked resume examples by role and experience level, with the reasoning behind each structural choice.",
};

export default function ExamplesPage() {
  const byLevel = EXAMPLES.reduce<Record<string, number>>((acc, example) => {
    acc[example.level] = (acc[example.level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Examples"
        title="Ten resumes, and why each one is built that way"
        description="Every example shows the structure, the sample wording and the trade-offs. Use them as a pattern to copy, not text to paste."
      >
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(byLevel).map(([level, count]) => (
            <Badge key={level} tone="neutral">
              {level} · {count}
            </Badge>
          ))}
        </div>
      </PageHeader>

      <div className="container-page grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((example) => {
          const template = getTemplate(example.templateId);
          const preview = buildTemplatePreview(example.templateId, "short");
          return (
            <Link
              key={example.slug}
              href={`/examples/${example.slug}`}
              className="group flex flex-col overflow-hidden rounded-[9px] border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card)]"
            >
              <div className="bg-[#f2efe9] p-3">
                <ResumeThumb doc={preview} template={template} width={228} className="mx-auto shadow-[0_4px_14px_-6px_rgba(21,23,27,0.3)]" />
              </div>
              <div className="flex flex-1 flex-col border-t border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="accent">{example.role}</Badge>
                  <span className="text-[10.5px] text-subtle">{template.name}</span>
                </div>
                <h2 className="mt-2 text-[14px] font-semibold text-ink">{example.title}</h2>
                <p className="mt-1 flex-1 line-clamp-3 text-[12px] leading-relaxed text-subtle">{example.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                  Open example <ArrowUpRight className="size-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </SiteShell>
  );
}
