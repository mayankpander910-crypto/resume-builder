import { beforeEach, describe, expect, it } from "vitest";
import { useResumeStore } from "@/store/resume-store";
import { TEMPLATES } from "@/lib/templates/registry";
import { sampleSections } from "@/lib/content/sample-resume";
import { isResumeEmpty } from "@/lib/resume/schema/factory";

const reset = () => {
  const store = useResumeStore.getState();
  store.resetToBlank();
  useResumeStore.setState({ past: [], future: [], lastHistoryKey: null, lastHistoryAt: 0 });
};

describe("editor store", () => {
  beforeEach(reset);

  it("starts from a blank, editable document", () => {
    const { doc } = useResumeStore.getState();
    expect(doc.sections.length).toBeGreaterThan(0);
    expect(doc.meta.templateId).toBeTruthy();
  });

  it("records history and can undo and redo", () => {
    const store = useResumeStore.getState();
    store.updateBasics({ fullName: "Aarav Mehta" });
    expect(useResumeStore.getState().doc.basics.fullName).toBe("Aarav Mehta");
    expect(useResumeStore.getState().canUndo()).toBe(true);

    useResumeStore.getState().undo();
    expect(useResumeStore.getState().doc.basics.fullName).toBe("");

    useResumeStore.getState().redo();
    expect(useResumeStore.getState().doc.basics.fullName).toBe("Aarav Mehta");
  });

  it("coalesces rapid edits that share a history key", async () => {
    const store = useResumeStore.getState();
    store.setDocumentName("A");
    const depthAfterFirst = useResumeStore.getState().past.length;
    store.setDocumentName("AB");
    store.setDocumentName("ABC");
    const depthAfterKeystrokes = useResumeStore.getState().past.length;
    expect(depthAfterKeystrokes).toBe(depthAfterFirst);

    useResumeStore.getState().undo();
    expect(useResumeStore.getState().doc.meta.name).not.toBe("ABC");
  });

  it("keeps content when the template changes, and counts it as one undo step", () => {
    const store = useResumeStore.getState();
    store.setDoc({ ...useResumeStore.getState().doc, sections: sampleSections("medium") });
    const texts = useResumeStore.getState().doc.sections.map((section) => JSON.stringify(section.data));
    const historyBefore = useResumeStore.getState().past.length;

    const target = TEMPLATES.find((template) => template.id !== useResumeStore.getState().doc.meta.templateId)!;
    useResumeStore.getState().applyTemplate(target.id);

    const after = useResumeStore.getState().doc;
    expect(after.meta.templateId).toBe(target.id);
    expect(after.sections.map((section) => JSON.stringify(section.data)).sort()).toEqual([...texts].sort());
    expect(useResumeStore.getState().past.length).toBe(historyBefore + 1);

    useResumeStore.getState().undo();
    expect(useResumeStore.getState().doc.meta.templateId).not.toBe(target.id);
  });

  it("can switch template without overwriting a customised theme", () => {
    const store = useResumeStore.getState();
    store.updateTheme({ accentColor: "#123456" });
    const target = TEMPLATES.find((template) => template.id !== useResumeStore.getState().doc.meta.templateId)!;
    useResumeStore.getState().applyTemplate(target.id, { keepTheme: true });
    expect(useResumeStore.getState().doc.theme.accentColor).toBe("#123456");

    useResumeStore.getState().applyTemplate(target.id, { keepTheme: false });
    expect(useResumeStore.getState().doc.theme.accentColor).toBe(target.theme.accentColor);
  });

  it("reorders and re-columns sections on drag", () => {
    const store = useResumeStore.getState();
    const initial = useResumeStore.getState().doc.sections.map((section) => section.id);
    store.moveSection(initial[1], initial[0]);
    const after = useResumeStore.getState().doc.sections.map((section) => section.id);
    expect(after[0]).not.toBe(initial[0]);
    expect(after.slice().sort()).toEqual(initial.slice().sort());
  });

  it("hides and restores a section without deleting it", () => {
    const id = useResumeStore.getState().doc.sections[0].id;
    useResumeStore.getState().toggleSection(id);
    expect(useResumeStore.getState().doc.sections.find((section) => section.id === id)?.visible).toBe(false);
    useResumeStore.getState().toggleSection(id);
    expect(useResumeStore.getState().doc.sections.find((section) => section.id === id)?.visible).toBe(true);
  });

  it("adds, duplicates and removes sections", () => {
    const before = useResumeStore.getState().doc.sections.length;
    const id = useResumeStore.getState().addSection("projects");
    expect(useResumeStore.getState().doc.sections.length).toBe(before + 1);
    useResumeStore.getState().duplicateSection(id);
    expect(useResumeStore.getState().doc.sections.length).toBe(before + 2);
    useResumeStore.getState().removeSection(id);
    expect(useResumeStore.getState().doc.sections.some((section) => section.id === id)).toBe(false);
  });

  it("loads sample content on request and never on its own", () => {
    // A blank document has structure but no written content.
    expect(isResumeEmpty(useResumeStore.getState().doc)).toBe(true);
    useResumeStore.getState().loadSample();
    const doc = useResumeStore.getState().doc;
    expect(doc.meta.name).toBe("Sample resume");
    expect(doc.sections.length).toBeGreaterThan(3);
    expect(JSON.stringify(doc.sections)).toContain("Northwind Labs");
    expect(isResumeEmpty(doc)).toBe(false);
  });
});
