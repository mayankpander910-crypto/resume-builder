import { describe, expect, it } from "vitest";
import { TEMPLATES, applyTemplateToSections, filterTemplates, getTemplate, templatePageSettings } from "@/lib/templates/registry";
import { ARCHETYPES, archetypeOf } from "@/lib/templates/archetypes";
import { sampleSections } from "@/lib/content/sample-resume";
import { createEmptyResume } from "@/lib/resume/schema/factory";
import type { ResumeDocument } from "@/types/resume";
import { TEMPLATE_CATEGORIES } from "@/types/template";

const docWithSampleContent = (): ResumeDocument => {
  const base = createEmptyResume("Test resume");
  return { ...base, sections: sampleSections("medium") };
};

describe("template registry", () => {
  it("ships the promised 60–100 templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(60);
    expect(TEMPLATES.length).toBeLessThanOrEqual(100);
  });

  it("has unique ids and slugs", () => {
    const ids = TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("gives every template a distinct name and tagline", () => {
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(TEMPLATES.length);
    expect(new Set(TEMPLATES.map((t) => t.tagline)).size).toBe(TEMPLATES.length);
  });

  it("covers every category with at least one template", () => {
    for (const category of TEMPLATE_CATEGORIES) {
      expect(TEMPLATES.some((template) => template.category === category.id)).toBe(true);
    }
  });

  it("references only real archetypes", () => {
    for (const template of TEMPLATES) {
      expect(() => archetypeOf(template.archetype)).not.toThrow();
      expect(ARCHETYPES[template.archetype]).toBeDefined();
    }
  });

  it("keeps template metadata internally consistent", () => {
    for (const template of TEMPLATES) {
      expect([1, 2, 3]).toContain(template.columns);
      expect(template.atsScore).toBeGreaterThanOrEqual(0);
      expect(template.atsScore).toBeLessThanOrEqual(100);
      expect(template.sectionOrder.length).toBeGreaterThan(3);
      expect(new Set(template.sectionOrder).size).toBe(template.sectionOrder.length);
      expect(template.tags.length).toBeGreaterThan(0);
      expect(template.tagline.length).toBeGreaterThan(8);
      expect(template.atsLabel.length).toBeGreaterThan(4);
      // a template is a layout recipe: it may restyle, but it cannot carry content
      expect(template).not.toHaveProperty("sections");
    }
  });

  it("differs structurally, not only by colour", () => {
    const shapes = new Set(
      TEMPLATES.map((t) =>
        [
          t.archetype,
          t.columns,
          archetypeOf(t.archetype).bandHeader,
          archetypeOf(t.archetype).tintSidebar,
          archetypeOf(t.archetype).columnRule,
          archetypeOf(t.archetype).timeline,
          archetypeOf(t.archetype).headingStyle,
          t.pageSize,
        ].join("|"),
      ),
    );
    expect(shapes.size).toBeGreaterThanOrEqual(16);
  });

  it("falls back to a sane default for an unknown id", () => {
    expect(getTemplate("definitely-not-a-template").id).toBe(TEMPLATES[0].id);
    expect(getTemplate(undefined).id).toBe(TEMPLATES[0].id);
  });

  it("maps page settings from the template", () => {
    const template = TEMPLATES.find((t) => t.pageSize === "letter") ?? TEMPLATES[0];
    expect(templatePageSettings(template).size).toBe(template.pageSize);
  });
});

describe("switching templates", () => {
  it("never loses or mutates content", () => {
    const doc = docWithSampleContent();
    const byId = (sections: ResumeDocument["sections"]) =>
      Object.fromEntries(sections.map((section) => [section.id, JSON.stringify(section.data)]));
    const before = byId(doc.sections);
    const beforeOrder = doc.sections.map((section) => section.id).join(",");

    for (const template of TEMPLATES) {
      const next = applyTemplateToSections(doc, template);
      expect(next).toHaveLength(doc.sections.length);
      // Reordering is the point of a template; the content of each section must not move.
      expect(byId(next)).toEqual(before);
      for (const section of next) expect(typeof section.column).toBe("number");
      if (template.columns === 1) expect(next.every((section) => section.column === 0)).toBe(true);
    }

    // The source document is untouched, order included.
    expect(byId(doc.sections)).toEqual(before);
    expect(doc.sections.map((section) => section.id).join(",")).toBe(beforeOrder);
  });

  it("orders sections according to the template recipe", () => {
    const doc = docWithSampleContent();
    for (const template of TEMPLATES.slice(0, 12)) {
      const next = applyTemplateToSections(doc, template);
      const rank = new Map(template.sectionOrder.map((kind, index) => [kind, index]));
      const ranks = next.map((section) => rank.get(section.kind)).filter((value): value is number => value !== undefined);
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    }
  });
});

describe("filterTemplates", () => {
  it("filters by category, industry and ATS floor", () => {
    const creative = filterTemplates({ category: "creative" });
    expect(creative.length).toBeGreaterThan(0);
    expect(creative.every((template) => template.category === "creative")).toBe(true);

    const ats = filterTemplates({ atsOnly: true });
    expect(ats.length).toBeGreaterThan(0);
    expect(ats.every((template) => template.atsScore >= 90)).toBe(true);

    const search = filterTemplates({ search: "minimal" });
    expect(search.length).toBeGreaterThan(0);
  });

  it("returns everything for an empty filter", () => {
    expect(filterTemplates({})).toHaveLength(TEMPLATES.length);
  });
});
