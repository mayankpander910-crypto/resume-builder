import { z } from "zod";

/**
 * Output contracts. Every provider response is validated against one of these
 * before the UI is allowed to touch it, so a hallucinated shape degrades into a
 * clean error instead of corrupting a resume.
 */

const str = (max = 2000) => z.string().max(max);

export const generatedResumeSchema = z.object({
  summary: str(1200).optional().default(""),
  experience: z
    .array(
      z.object({
        role: str(160),
        company: str(160),
        location: str(120).optional().default(""),
        startDate: str(40).optional().default(""),
        endDate: str(40).optional().default(""),
        bullets: z.array(str(500)).max(8).optional().default([]),
      }),
    )
    .max(12)
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        degree: str(180),
        institution: str(180),
        location: str(120).optional().default(""),
        startDate: str(40).optional().default(""),
        endDate: str(40).optional().default(""),
        details: z.array(str(300)).max(5).optional().default([]),
      }),
    )
    .max(8)
    .optional()
    .default([]),
  skills: z
    .array(z.object({ name: str(80), items: z.array(str(60)).max(30) }))
    .max(10)
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        name: str(180),
        role: str(120).optional().default(""),
        description: str(600).optional().default(""),
        bullets: z.array(str(500)).max(6).optional().default([]),
        tech: z.array(str(40)).max(20).optional().default([]),
      }),
    )
    .max(8)
    .optional()
    .default([]),
  certifications: z
    .array(z.object({ name: str(180), issuer: str(160).optional().default(""), date: str(40).optional().default("") }))
    .max(10)
    .optional()
    .default([]),
  achievements: z
    .array(z.object({ title: str(180), issuer: str(160).optional().default(""), date: str(40).optional().default(""), description: str(400).optional().default("") }))
    .max(10)
    .optional()
    .default([]),
  languages: z
    .array(z.object({ name: str(60), proficiency: str(60).optional().default("") }))
    .max(10)
    .optional()
    .default([]),
  missingInformation: z.array(str(300)).max(12).optional().default([]),
  followUpQuestions: z.array(str(300)).max(8).optional().default([]),
  headline: str(160).optional().default(""),
});

export type GeneratedResume = z.infer<typeof generatedResumeSchema>;

export const improvedTextSchema = z.object({
  improved: str(4000),
  changes: z.array(str(300)).max(10).optional().default([]),
  warnings: z.array(str(300)).max(8).optional().default([]),
  needsMoreInfo: z.array(str(300)).max(6).optional().default([]),
});

export type ImprovedText = z.infer<typeof improvedTextSchema>;

export const bulletsSchema = z.object({
  bullets: z.array(str(500)).min(1).max(10),
  notes: z.array(str(300)).max(6).optional().default([]),
});

export const reviewSchema = z.object({
  overallScore: z.number().min(0).max(100).optional(),
  summary: str(1200).optional().default(""),
  strengths: z.array(str(400)).max(10).optional().default([]),
  issues: z
    .array(
      z.object({
        section: str(80),
        severity: z.enum(["high", "medium", "low"]).default("medium"),
        problem: str(400),
        suggestion: str(600),
        /** Optional replacement text the user can accept. */
        replacement: str(1200).optional(),
      }),
    )
    .max(25)
    .optional()
    .default([]),
  missingSections: z.array(str(120)).max(10).optional().default([]),
  questions: z.array(str(300)).max(8).optional().default([]),
});

export type ReviewResult = z.infer<typeof reviewSchema>;

export const tailorSchema = z.object({
  matchScore: z.number().min(0).max(100).optional(),
  matchedKeywords: z.array(str(80)).max(40).optional().default([]),
  missingKeywords: z.array(str(80)).max(40).optional().default([]),
  suggestions: z
    .array(
      z.object({
        section: str(80).optional().default(""),
        current: str(600).optional().default(""),
        suggested: str(900),
        rationale: str(400).optional().default(""),
      }),
    )
    .max(15)
    .optional()
    .default([]),
  summaryRewrite: str(1200).optional().default(""),
  warnings: z.array(str(300)).max(6).optional().default([]),
});

export type TailorResult = z.infer<typeof tailorSchema>;

/**
 * Models regularly wrap JSON in prose or fences. This extracts the first
 * balanced JSON object, then parses it.
 */
export const parseJsonLoose = (raw: string): unknown => {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = candidate.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        return null;
      }
    }
    return null;
  }
};
