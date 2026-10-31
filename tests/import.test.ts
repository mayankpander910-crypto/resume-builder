import { describe, expect, it } from "vitest";
import { parseResumeText } from "@/lib/resume/import/parse";
import { sanitizeText } from "@/lib/resume/import/extract";
import { parsedToSections } from "@/lib/resume/import/parse";
import { createEmptyResume, isResumeEmpty } from "@/lib/resume/schema/factory";

const RESUME = `Aarav Mehta
Senior Product Engineer
aarav.mehta@example.com | +91 98250 41120 | Bengaluru, IN
linkedin.com/in/aaravmehta

PROFESSIONAL SUMMARY
Product-minded engineer with eight years building billing and scheduling systems.

WORK EXPERIENCE
Senior Product Engineer
Northwind Labs — Bengaluru, IN
Mar 2022 - Present
- Rebuilt the metering pipeline on an event-sourced ledger, cutting invoice disputes by 38%.
- Mentored three engineers through promotion.

Product Engineer
Fieldline — Remote
Jul 2019 - Feb 2022
- Shipped the scheduling engine that made multi-timezone booking possible.

EDUCATION
B.Tech, Computer Science and Engineering
National Institute of Technology, Surathkal
2013 - 2017

SKILLS
TypeScript, Python, Go, PostgreSQL, Kafka, AWS

CERTIFICATIONS
AWS Certified Solutions Architect, Amazon Web Services, 2023

HOBBIES
Bouldering, film photography`;

describe("resume text parsing", () => {
  const parsed = parseResumeText(RESUME);

  it("finds contact details", () => {
    expect(parsed.basics.email).toBe("aarav.mehta@example.com");
    expect(parsed.basics.phone).toContain("98250");
    expect(parsed.basics.fullName?.toLowerCase()).toContain("aarav");
    expect(parsed.basics.linkedin).toContain("linkedin.com/in/aaravmehta");
  });

  it("reads the summary block", () => {
    expect(parsed.summary).toContain("Product-minded engineer");
  });

  it("splits work history into entries with dates and bullets", () => {
    expect(parsed.experience.length).toBe(2);
    const [first] = parsed.experience;
    expect(first.title).toContain("Senior Product Engineer");
    expect(first.subtitle).toContain("Northwind Labs");
    expect(first.date).toMatch(/2022/);
    expect(first.bullets.length).toBe(2);
    expect(first.bullets[0]).toContain("metering pipeline");
  });

  it("reads education and certifications", () => {
    expect(parsed.education.length).toBe(1);
    expect(parsed.education[0].title).toContain("B.Tech");
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.certifications[0].title).toContain("AWS Certified");
  });

  it("collects skills from a comma list", () => {
    expect(parsed.skills).toContain("TypeScript");
    expect(parsed.skills).toContain("Kafka");
    expect(parsed.skills.length).toBe(6);
  });

  it("surfaces unknown headings instead of guessing", () => {
    expect(parsed.unmapped.some((block) => /hobbies/i.test(block.heading))).toBe(true);
  });

  it("reports what it detected and is honest about confidence", () => {
    expect(parsed.detected.length).toBeGreaterThan(3);
    // confidence is a 0–100 percentage, never a fake certainty
    expect(parsed.confidence).toBeGreaterThan(0);
    expect(parsed.confidence).toBeLessThanOrEqual(95);
  });

  it("produces sections that are non-empty and typed", () => {
    const sections = parsedToSections(parsed, {
      basics: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      achievements: true,
    });
    expect(sections.length).toBeGreaterThanOrEqual(4);
    expect(sections.every((section) => section.id && section.kind && section.title)).toBe(true);
    expect(sections.some((section) => section.kind === "experience")).toBe(true);
    const doc = { ...createEmptyResume("Imported"), sections };
    expect(isResumeEmpty(doc)).toBe(false);
  });

  it("copes with text that has no structure at all", () => {
    const sparse = parseResumeText("just some words with no headings or dates at all");
    expect(sparse.experience).toEqual([]);

    expect(sparse.warnings.length).toBeGreaterThan(0);
  });

  it("does not crash on empty input", () => {
    const empty = parseResumeText("");
    expect(empty.skills).toEqual([]);
    expect(empty.experience).toEqual([]);
  });
});

describe("text sanitation", () => {
  it("normalises whitespace and invisible characters", () => {
    expect(sanitizeText("Aarav\u00a0Mehta\r\nNext line  ")).toBe("Aarav Mehta\nNext line");
    expect(sanitizeText("a\u0000b\u0007")).toBe("ab");
  });

  it("keeps bullet characters that carry meaning", () => {
    expect(sanitizeText("- Built a thing")).toBe("- Built a thing");
  });
});
