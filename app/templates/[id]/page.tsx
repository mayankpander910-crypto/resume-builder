import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { TemplateDetail } from "@/components/templates/template-detail";
import { TEMPLATES, getTemplate } from "@/lib/templates/registry";

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const template = TEMPLATES.find((entry) => entry.id === id);
  if (!template) return { title: "Template not found" };
  return {
    title: `${template.name} resume template`,
    description: `${template.tagline} ${template.atsLabel}. Preview the real output and use it free.`,
  };
}

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!TEMPLATES.some((entry) => entry.id === id)) notFound();
  const template = getTemplate(id);
  return (
    <SiteShell>
      <TemplateDetail template={template} />
    </SiteShell>
  );
}
