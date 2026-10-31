import { describe, expect, it } from "vitest";
import { analyzePlainText, analyzeResume, extractKeywords } from "@/lib/ats/analyze";
import { createEmptyResume } from "@/lib/resume/schema/factory";
import { sampleSections } from "@/lib/content/sample-resume";
import { TEMPLATES } from "@/lib/templates/registry";
import type { ResumeDocument } from "@/types/resume";

const sampleDoc = (): ResumeDocument => ({
  ...createEmptyResume("ATS test"),
  basics: {
    ...createEmptyResume().basics,
    fullName: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    phone: "+91 98250 41120",
    location: "Bengaluru, IN",
    linkedin: "linkedin.com/in/aaravmehta",
  },
  sections: sampleSections("medium"),
});

const JD = `We are hiring a Senior Backend Engineer to own our billing platform.
You will build event-sourced services in Go and TypeScript, operate PostgreSQL and Kafka,
and drive observability. Experience mentoring engineers and designing APIs is required.`;

describe("ATS heuristics", () => {
  it("scores a complete resume higher than an empty one", () => {
    const full = analyzeResume(sampleDoc());
    const empty = analyzeResume(createEmptyResume());
    expect(full.score).toBeGreaterThan(empty.score);
    expect(full.score).toBeGreaterThanOrEqual(50);
    expect(empty.score).toBeLessThan(60);
    expect(["excellent", "good", "fair", "needs work"]).toContain(full.band);
  });

  it("ships a disclaimer that says it is not an employer score", () => {
    const report = analyzeResume(sampleDoc());
    expect(report.disclaimer.toLowerCase()).toContain("not");
    expect(report.disclaimer.toLowerCase()).toMatch(/ats|applicant tracking/);
  });

  it("returns the documented number of checks", () => {
    const doc = sampleDoc();
    expect(analyzeResume(doc).checks.length).toBe(18);
    expect(analyzeResume(doc, { jobDescription: JD }).checks.length).toBe(19);
    expect(analyzePlainText("Aarav Mehta\naarav@example.com\nEXPERIENCE\n- Built a thing").checks.length).toBe(11);
  });

  it("always returns checks with weights and details", () => {
    const report = analyzeResume(sampleDoc());
    expect(report.checks.length).toBeGreaterThanOrEqual(12);
    for (const check of report.checks) {
      expect(check.id).toBeTruthy();
      expect(check.detail.length).toBeGreaterThan(5);
      expect(["pass", "warn", "fail", "info"]).toContain(check.status);
      expect(check.weight).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(report.checks.map((check) => check.id)).size).toBe(report.checks.length);
  });

  it("scores are bounded and reproducible", () => {
    const doc = sampleDoc();
    const a = analyzeResume(doc);
    const b = analyzeResume(doc);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    expect(a.score).toBe(b.score);
  });

  it("flags missing contact details", () => {
    const doc = sampleDoc();
    const broken: ResumeDocument = { ...doc, basics: { ...doc.basics, email: "", phone: "" } };
    const report = analyzeResume(broken);
    const contact = report.checks.find((check) => check.id === "contact");
    expect(contact).toBeDefined();
    expect(contact?.status).not.toBe("pass");
  });

  it("penalises visual templates through the template score", () => {
    const safe = TEMPLATES.find((template) => template.atsScore >= 95)!;
    const risky = TEMPLATES.reduce((worst, template) => (template.atsScore < worst.atsScore ? template : worst), TEMPLATES[0]);
    const safeReport = analyzeResume({ ...sampleDoc(), meta: { ...sampleDoc().meta, templateId: safe.id } });
    const riskyReport = analyzeResume({ ...sampleDoc(), meta: { ...sampleDoc().meta, templateId: risky.id } });
    expect(safeReport.stats.atsTemplateScore).toBeGreaterThan(riskyReport.stats.atsTemplateScore);
  });

  it("reports keyword coverage against a job description", () => {
    const doc = sampleDoc();
    const without = analyzeResume(doc);
    const withJd = analyzeResume(doc, { jobDescription: JD });
    expect(without.keywords).toBeNull();
    expect(withJd.keywords).not.toBeNull();
    expect(withJd.keywords!.coverage).toBeGreaterThan(0);
    expect(withJd.keywords!.matched.length + withJd.keywords!.missing.length).toBeGreaterThan(4);
    // A term that appears in the resume must not be listed as missing.
    for (const term of withJd.keywords!.matched) {
      expect(withJd.keywords!.missing).not.toContain(term);
    }
  });

  it("collects bullet-level issues without inventing them", () => {
    const doc = sampleDoc();
    const report = analyzeResume(doc);
    for (const issue of report.bulletIssues) {
      expect(issue.text.length).toBeGreaterThan(0);
      expect(issue.reason.length).toBeGreaterThan(0);
      // every reported bullet must actually exist in the document
      const allText = JSON.stringify(doc.sections);
      expect(allText).toContain(issue.text.slice(0, 25));
    }
  });

  it("counts words, bullets and pages", () => {
    const report = analyzeResume(sampleDoc());
    expect(report.stats.words).toBeGreaterThan(200);
    expect(report.stats.bullets).toBeGreaterThan(5);
    expect(report.stats.quantifiedBullets).toBeGreaterThan(0);
    expect(report.stats.estimatedPages).toBeGreaterThanOrEqual(1);
  });

  it("analyses pasted plain text too", () => {
    const text = `Aarav Mehta
aarav.mehta@example.com | +91 98250 41120

EXPERIENCE
Senior Engineer, Northwind Labs 2022 - Present
- Rebuilt the metering pipeline, cutting invoice disputes by 38%
- Mentored three engineers through promotion

EDUCATION
B.Tech, NIT Surathkal, 2017

SKILLS
TypeScript, Go, PostgreSQL`;
    const report = analyzePlainText(text);
    expect(report.stats.words).toBeGreaterThan(20);
    expect(report.score).toBeGreaterThan(0);
    const jdReport = analyzePlainText(text, { jobDescription: JD });
    expect(jdReport.keywords?.coverage).toBeGreaterThan(0);
  });

  it("extracts keywords without stopwords or duplicates", () => {
    const terms = extractKeywords(JD);
    expect(terms.length).toBeGreaterThan(3);
    const lowered = terms.map((term) => term.term.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
    expect(lowered).not.toContain("and");
    expect(lowered).not.toContain("the");
    for (const term of terms) expect(term.count).toBeGreaterThan(0);
  });
});
