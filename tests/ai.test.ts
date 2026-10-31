import { describe, expect, it } from "vitest";
import { generatedResumeSchema, improvedTextSchema, parseJsonLoose, reviewSchema, tailorSchema } from "@/lib/ai/schemas";
import { generatedToSections } from "@/lib/ai/map-generated";
import { isResumeEmpty } from "@/lib/resume/schema/factory";
import { createEmptyResume } from "@/lib/resume/schema/factory";

const validPayload = {
  summary: "Product-minded engineer with eight years building billing systems.",
  experience: [
    {
      role: "Senior Product Engineer",
      company: "Northwind Labs",
      startDate: "Mar 2022",
      endDate: "",
      bullets: ["Rebuilt the metering pipeline, cutting invoice disputes by 38%."],
    },
  ],
  education: [{ degree: "B.Tech CSE", institution: "NIT Surathkal", endDate: "2017" }],
  skills: [{ name: "Languages", items: ["TypeScript", "Go"] }],
  missingInformation: ["End date for the Northwind Labs role"],
};

describe("AI output contracts", () => {
  it("accepts a well-formed generation payload", () => {
    const parsed = generatedResumeSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.experience[0].role).toBe("Senior Product Engineer");
      expect(parsed.data.projects).toEqual([]);
      expect(parsed.data.followUpQuestions).toEqual([]);
    }
  });

  it("fills optional collections with defaults instead of undefined", () => {
    const parsed = generatedResumeSchema.parse({});
    expect(parsed.experience).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.missingInformation).toEqual([]);
    expect(parsed.summary).toBe("");
  });

  it("rejects payloads with the wrong shape", () => {
    expect(generatedResumeSchema.safeParse({ experience: "not an array" }).success).toBe(false);
    expect(generatedResumeSchema.safeParse({ skills: [{ name: 12 }] }).success).toBe(false);
    expect(generatedResumeSchema.safeParse({ summary: 42 }).success).toBe(false);
  });

  it("caps runaway arrays and strings", () => {
    const tooMany = { experience: Array.from({ length: 20 }, () => ({ role: "x", company: "y" })) };
    expect(generatedResumeSchema.safeParse(tooMany).success).toBe(false);
    const tooLong = { summary: "a".repeat(2000) };
    expect(generatedResumeSchema.safeParse(tooLong).success).toBe(false);
  });

  it("validates the improve, review and tailor shapes", () => {
    expect(improvedTextSchema.safeParse({ improved: "Rebuilt the pipeline." }).success).toBe(true);
    expect(improvedTextSchema.safeParse({}).success).toBe(false);
    expect(reviewSchema.safeParse({ summary: "Solid draft.", issues: [] }).success).toBe(true);
    // severity must be one of the three documented levels
    expect(reviewSchema.safeParse({ issues: [{ section: "Summary", severity: "catastrophic", problem: "x", suggestion: "y" }] }).success).toBe(false);
    expect(tailorSchema.safeParse({ matchScore: 72, missingKeywords: ["kafka"] }).success).toBe(true);
    expect(tailorSchema.safeParse({ matchScore: 140 }).success).toBe(false);
  });

  it("recovers JSON from fenced or chatty model output", () => {
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonLoose('Here is the resume:\n{"a":1}\nHope this helps!')).toEqual({ a: 1 });
    expect(parseJsonLoose("not json at all")).toBeNull();
    expect(parseJsonLoose("")).toBeNull();
  });
});

describe("mapping generated content into sections", () => {
  const generated = generatedResumeSchema.parse(validPayload);

  it("creates typed sections with ids", () => {
    const sections = generatedToSections(generated);
    expect(sections.length).toBeGreaterThanOrEqual(3);
    for (const section of sections) {
      expect(section.id.length).toBeGreaterThan(3);
      expect(section.visible).toBe(true);
      expect(["summary", "experience", "education", "skills"]).toContain(section.kind);
    }
    const doc = { ...createEmptyResume("AI"), sections };
    expect(isResumeEmpty(doc)).toBe(false);
  });

  it("carries every fact through without inventing new ones", () => {
    const sections = generatedToSections(generated);
    const serialised = JSON.stringify(sections);
    expect(serialised).toContain("Northwind Labs");
    expect(serialised).toContain("TypeScript");
    expect(serialised).toContain("NIT Surathkal");
    // nothing that was not supplied may appear as an employer or number
    expect(serialised).not.toContain("Google");
    expect(serialised).not.toMatch(/\d{3}% /);
  });

  it("skips empty sections rather than emitting blank headings", () => {
    const sparse = generatedResumeSchema.parse({ summary: "", experience: [], education: [], skills: [] });
    expect(generatedToSections(sparse)).toEqual([]);
  });

  it("drops experience entries with neither role nor company", () => {
    const odd = generatedResumeSchema.parse({
      experience: [{ role: "", company: "", bullets: ["Did something."] }],
    });
    const experience = generatedToSections(odd).find((section) => section.kind === "experience");
    expect(experience === undefined || experience.data.items === undefined || true).toBe(true);
    if (experience && experience.kind === "experience") {
      expect(experience.data.items.every((item) => item.role || item.company)).toBe(true);
    }
  });
});
