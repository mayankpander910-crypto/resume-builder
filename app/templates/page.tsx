import type { Metadata } from "next";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { TEMPLATES } from "@/lib/templates/registry";

export const metadata: Metadata = {
  title: "Resume templates",
  description: `Browse ${TEMPLATES.length} distinct resume templates — ATS-friendly, technical, student, corporate, creative and international layouts, each with an honest ATS rating.`,
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; template?: string }>;
}) {
  const params = await searchParams;
  return (
    <SiteShell>
      <PageHeader
        eyebrow={`${TEMPLATES.length} templates`}
        title="Every layout is a different argument about how to be read"
        description="Filter by category, industry, experience level, column structure and ATS safety. Each card shows a real resume rendered in that template — not a mockup."
      />
      <TemplateGallery initialCategory={params.category ?? "all"} initialSearch={params.template ?? ""} />
    </SiteShell>
  );
}
