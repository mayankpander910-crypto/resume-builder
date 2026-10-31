import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { EXAMPLES, getExample } from "@/lib/content/examples";
import { getTemplate } from "@/lib/templates/registry";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { Badge } from "@/components/ui/misc";

export function generateStaticParams() {
  return EXAMPLES.map((example) => ({ slug: example.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) return { title: "Example not found" };
  return { title: `${example.title} resume example`, description: example.description };
}

export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) notFound();
  const template = getTemplate(example.templateId);
  const doc = buildTemplatePreview(example.templateId, "medium");

  return (
    <SiteShell>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="lg:order-1">
          <Link href="/examples" className="text-[12px] text-subtle hover:text-ink">
            ← All examples
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{example.role}</Badge>
            <Badge>{example.level}</Badge>
            <Badge>{example.industry}</Badge>
          </div>
          <h1 className="mt-2 text-[26px] leading-tight">{example.title}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-subtle">{example.description}</p>

          <div className="mt-4 rounded-[8px] border border-line bg-surface p-3">
            <p className="text-[10.5px] uppercase tracking-[0.09em] text-subtle">Template used</p>
            <p className="text-[13px] font-medium text-ink">{template.name}</p>
            <p className="mt-0.5 text-[11.5px] text-subtle">{template.atsLabel}</p>
            <Link href={`/templates/${template.id}`} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
              Preview the template <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {example.notes.map((note) => (
              <div key={note.heading} className="rounded-[8px] border border-line bg-surface p-3">
                <p className="text-[12px] font-semibold text-ink">{note.heading}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-subtle">{note.body}</p>
              </div>
            ))}
            <div className="rounded-[8px] border border-warn/30 bg-warn-soft p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-warn">
                <TriangleAlert className="size-3.5" /> Watch out
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-warn/90">{example.watchOut}</p>
            </div>
          </div>

          <Link
            href="/builder?new=1"
            className="mt-4 flex h-11 items-center justify-center gap-1.5 rounded-[6px] bg-accent text-[14px] font-medium text-white hover:bg-accent-hover"
          >
            Build mine with this template <ArrowRight className="size-4" />
          </Link>
        </aside>

        <div className="overflow-hidden rounded-[9px] border border-line bg-[#e9e6df] p-4 lg:order-2">
          <div className="mx-auto w-fit">
            <ResumeCanvas doc={doc} template={template} mode="paged" zoom={0.82} />
          </div>
          <p className="mt-2 text-center text-[11px] text-subtle">
            Sample content, rendered live in the {template.name} template. The names and figures are illustrative.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
