import type { ResumeDocument } from "@/types/resume";
import { buildSampleResume, type SampleLength } from "@/lib/content/sample-resume";
import { applyTemplateToSections, getTemplate, templatePageSettings } from "@/lib/templates/registry";

/**
 * Builds a demo document styled with a specific template. Used by the gallery,
 * the template detail page and the template switcher — one source of truth so
 * every preview shows the same realistic content.
 */
export const buildTemplatePreview = (templateId: string, length: SampleLength = "medium"): ResumeDocument => {
  const template = getTemplate(templateId);
  const base = buildSampleResume(template.id, length);
  return {
    ...base,
    sections: applyTemplateToSections(base, template),
    theme: { ...template.theme },
    page: templatePageSettings(template),
    layout: { ...template.layout },
    meta: { ...base.meta, templateId: template.id, name: `Preview · ${template.name}` },
  };
};
