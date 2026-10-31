import { describe, expect, it } from "vitest";
import {
  FONT_LABELS,
  PAGE_SPECS,
  columnOrder,
  getPageMetrics,
  getTypeScale,
  isDarkColor,
  mixWithWhite,
  pxFromMm,
  pxFromPt,
  withAlpha,
} from "@/lib/resume/renderer/metrics";
import { paginateColumn, paginateDocument, type BlockSpec } from "@/lib/resume/renderer/paginate";
import { formatRange, initials, normalizeUrl, proficiencyDots, slugify } from "@/lib/resume/renderer/format";
import { resumeToPlainText, sectionToText } from "@/lib/resume/renderer/plain-text";
import { createEmptyResume } from "@/lib/resume/schema/factory";
import { sampleSections } from "@/lib/content/sample-resume";

describe("page metrics", () => {
  it("uses A4 and Letter dimensions at 96 dpi", () => {
    expect(pxFromMm(210)).toBeCloseTo(793.7, 0);
    expect(pxFromInch(11)).toBeCloseTo(1056, 0);
    expect(pxFromMm(PAGE_SPECS.a4.widthMm)).toBeCloseTo(793.7, 0);
    expect(pxFromMm(PAGE_SPECS.letter.widthMm)).toBeCloseTo(816, 0);
    const doc = createEmptyResume();
    const metrics = getPageMetrics(doc.page, doc.layout);
    expect(metrics.width).toBeCloseTo(pxFromMm(PAGE_SPECS[doc.page.size].widthMm), 0);
    expect(metrics.height).toBeCloseTo(pxFromMm(PAGE_SPECS[doc.page.size].heightMm), 0);
  });

  it("subtracts padding and gutters from the text box", () => {
    const doc = createEmptyResume();
    const metrics = getPageMetrics(doc.page, doc.layout);
    expect(metrics.contentWidth).toBeLessThan(metrics.width);
    expect(metrics.contentHeight).toBeLessThan(metrics.height);
    expect(metrics.columns.length).toBe(doc.layout.columns);
    // The usable width of every column adds up to the content box (gutters included).
    const totalInner = metrics.columns.reduce((sum, column) => sum + column.inner, 0);
    expect(totalInner).toBeCloseTo(metrics.contentWidth, 0);
    for (const column of metrics.columns) {
      expect(column.inner).toBeGreaterThan(0);
      expect(column.inner).toBeLessThanOrEqual(column.width);
    }
  });

  it("orders columns for reading order", () => {
    const doc = createEmptyResume();
    expect(columnOrder({ ...doc.layout, columns: 1 })).toEqual([0]);
    expect(columnOrder({ ...doc.layout, columns: 2, sidebarPosition: "right" })).toEqual([0, 1]);
    expect(columnOrder({ ...doc.layout, columns: 2, sidebarPosition: "left" })).toEqual([1, 0]);
    // A three-column page puts the narrow side column first, matching the visual order.
    expect(columnOrder({ ...doc.layout, columns: 3 })).toEqual([1, 0, 2]);
  });

  it("exposes a type scale that grows with the font scale", () => {
    const doc = createEmptyResume();
    const base = getTypeScale(doc.theme);
    const larger = getTypeScale({ ...doc.theme, fontScale: doc.theme.fontScale + 0.1 });
    expect(larger.body).toBeGreaterThan(base.body);
    expect(FONT_LABELS[doc.theme.fontFamily]).toBeTruthy();
  });

  it("handles colour helpers predictably", () => {
    expect(isDarkColor("#111111")).toBe(true);
    expect(isDarkColor("#fafafa")).toBe(false);
    expect(withAlpha("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
    expect(mixWithWhite("#000000", 1)).toBe("#ffffff");
  });
});

// small helper kept local so the test documents the conversion it relies on
function pxFromInch(inch: number) {
  return pxFromPt(inch * 72);
}

describe("pagination", () => {
  const block = (key: string, height: number, sectionId = "s1", isHead = false): BlockSpec => ({
    key,
    sectionId,
    isHead,
    height,
  });

  it("keeps everything on one page when it fits", () => {
    const result = paginateColumn([block("h", 20, "s1", true), block("b1", 40), block("b2", 40)], {
      firstPageHeight: 600,
      pageHeight: 600,
    });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0]).toHaveLength(3);
  });

  it("never leaves a section head alone at the foot of a page", () => {
    const result = paginateColumn(
      [block("filler", 520), block("head", 24, "s2", true), block("body", 200, "s2")],
      { firstPageHeight: 600, pageHeight: 600 },
    );
    expect(result.pages.length).toBe(2);
    const firstPage = result.pages[0].map((entry) => entry.key);
    expect(firstPage).not.toContain("head");
  });

  it("re-emits a continuation head on the next page", () => {
    const blocks = [block("head", 24, "s1", true), ...Array.from({ length: 10 }, (_, i) => block(`b${i}`, 90))];
    const result = paginateColumn(blocks, { firstPageHeight: 300, pageHeight: 300 });
    expect(result.pages.length).toBeGreaterThan(1);
    // Every page after the first starts with the section head so the reader has context.
    for (const page of result.pages.slice(1)) expect(page[0].continued).toBe(true);
  });

  it("respects the max page guard for pathological input", () => {
    const blocks = Array.from({ length: 400 }, (_, i) => block(`b${i}`, 400));
    const result = paginateColumn(blocks, { firstPageHeight: 400, pageHeight: 400, maxPages: 5 });
    expect(result.pages.length).toBeLessThanOrEqual(6);
    expect(result.pages.length).toBeGreaterThan(0);
    // Anything that could not be placed is still returned rather than silently dropped.
    const placed = result.pages.flat().length;
    expect(placed).toBeGreaterThan(0);
  });

  it("gives two-column documents the same page count on both sides", () => {
    const doc = paginateDocument({
      main: [block("m1", 120), block("m2", 120), block("m3", 120)],
      side: [block("s1", 100, "side")],
      headerHeight: 140,
      pageHeight: 1000,
    });
    expect(doc.pageCount).toBe(1);
    expect(doc.main.pages[0].length).toBe(3);
  });

  it("counts at least one page for an empty document", () => {
    expect(paginateDocument({ main: [], side: [], headerHeight: 100, pageHeight: 900 }).pageCount).toBe(1);
  });
});

describe("formatting", () => {
  it("renders date ranges", () => {
    expect(formatRange("Mar 2022", "", true)).toBe("Mar 2022 – Present");
    expect(formatRange("Jun 2017", "Jun 2019")).toBe("Jun 2017 – Jun 2019");
    expect(formatRange("Mar 2022", "")).toBe("Mar 2022");
    expect(formatRange("", "Jun 2019")).toBe("Jun 2019");
    expect(formatRange("", "")).toBe("");
  });

  it("normalises urls without inventing a scheme", () => {
    expect(normalizeUrl("linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
  });

  it("builds initials and slugs", () => {
    expect(initials("Aarav Mehta")).toBe("AM");
    expect(initials("Aarav Kumar Mehta")).toBe("AM");
    // A single-word name falls back to its first two letters rather than one.
    expect(initials("Aarav")).toBe("AA");
    expect(initials("  ")).toBe("CV");
    expect(slugify("Senior Software Engineer!")).toBe("senior-software-engineer");
  });

  it("maps proficiency labels to a dot count", () => {
    expect(proficiencyDots("Native")).toBeGreaterThan(proficiencyDots("Basic"));
  });
});

describe("plain text export", () => {
  it("extracts every section's text", () => {
    const doc = { ...createEmptyResume("Test"), sections: sampleSections("medium") };
    const text = resumeToPlainText(doc);
    expect(text).toContain("Rebuilt the metering pipeline");
    expect(text).toContain("TypeScript");
    expect(text).not.toMatch(/<[a-z]/i);
    expect(text.length).toBeGreaterThan(600);
  });

  it("keeps hidden sections out of the plain text", () => {
    const doc = { ...createEmptyResume("Test"), sections: sampleSections("short") };
    const hidden = { ...doc, sections: doc.sections.map((section) => ({ ...section, visible: false })) };
    const text = resumeToPlainText(hidden).trim();
    const visibleText = resumeToPlainText(doc).trim();
    expect(text.length).toBeLessThan(visibleText.length);
  });

  it("renders a single section without markup", () => {
    const section = sampleSections("short").find((entry) => entry.kind === "skills");
    expect(section).toBeDefined();
    if (section) {
      const text = sectionToText(section);
      expect(text).not.toContain("<");
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
