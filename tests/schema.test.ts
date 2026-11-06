import { describe, expect, it } from "vitest";
import { createEmptyResume, createSection, sectionHasContent } from "@/lib/resume/schema/factory";
import { resumeDocumentSchema } from "@/lib/resume/schema/resume";
import { parseStoredDocument, validateDocument } from "@/lib/resume/validation/document";
import { sampleSections } from "@/lib/content/sample-resume";

describe("document schema", () => {
  it("round-trips a factory document through JSON", () => {
    const doc = createEmptyResume("Round trip");
    const parsed = resumeDocumentSchema.parse(JSON.parse(JSON.stringify(doc)));
    expect(parsed.meta.name).toBe("Round trip");
    expect(parsed.sections.length).toBe(doc.sections.length);
  });

  it("accepts persisted section formatting while keeping old documents valid", () => {
    const doc = createEmptyResume("Formatted");
    const legacy = resumeDocumentSchema.parse(JSON.parse(JSON.stringify(doc)));
    expect(legacy.sections[0].textStyle).toBeUndefined();

    const formattedDoc = {
      ...doc,
      sections: doc.sections.map((section, index) =>
        index === 0
          ? {
              ...section,
              textStyle: {
                bold: true,
                italic: true,
                underline: true,
                textAlign: "center" as const,
                fontSize: 14,
                color: "#123456",
              },
            }
          : section
      ),
    };

    expect(
      resumeDocumentSchema.parse(JSON.parse(JSON.stringify(formattedDoc)))
        .sections[0].textStyle?.fontSize
    ).toBe(14);
  });

  it("rejects documents that would break the renderer", () => {
    expect(resumeDocumentSchema.safeParse({}).success).toBe(false);
    expect(resumeDocumentSchema.safeParse({ meta: {}, basics: {}, sections: [] }).success).toBe(false);
    const doc = createEmptyResume();
    const broken = { ...doc, sections: [{ ...doc.sections[0], kind: "not-a-kind" }] };
    expect(resumeDocumentSchema.safeParse(broken).success).toBe(false);
  });

  it("creates sections that are empty until filled", () => {
    const section = createSection("experience");
    expect(sectionHasContent(section)).toBe(false);
    if (section.kind === "experience") {
      const filled = { ...section, data: { items: [{ ...section.data.items[0], role: "Engineer" }] } };
      expect(sectionHasContent(filled)).toBe(true);
    }
  });
});

describe("document validation", () => {
  it("treats a factory document as loadable with warnings", () => {
    const result = validateDocument(createEmptyResume());
    expect(result.ok).toBe(true);
    expect(result.fatal).toBe(false);
    expect(result.issues.some((issue) => issue.path === "basics.email")).toBe(true);
  });

  it("flags unparseable payloads as fatal", () => {
    const result = validateDocument({ hello: "world" });
    expect(result.ok).toBe(false);
    expect(result.fatal).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("survives a corrupt local storage payload", () => {
    expect(parseStoredDocument("{oops").doc).toBeNull();
    expect(parseStoredDocument("{oops").issues[0].level).toBe("error");
  });

  it("reads both wrapped and bare payloads", () => {
    const doc = { ...createEmptyResume("Wrapped"), sections: sampleSections("short") };
    expect(parseStoredDocument(JSON.stringify({ doc, savedAt: "2026-01-01" })).doc?.meta.name).toBe("Wrapped");
    expect(parseStoredDocument(JSON.stringify(doc)).doc?.meta.name).toBe("Wrapped");
  });

  it("counts duplicate section ids as a warning, not a failure", () => {
    const doc = createEmptyResume();
    const duplicated = { ...doc, sections: [doc.sections[0], { ...doc.sections[0] }] };
    const result = validateDocument(duplicated);
    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => /duplicate/i.test(issue.message))).toBe(true);
  });
});
