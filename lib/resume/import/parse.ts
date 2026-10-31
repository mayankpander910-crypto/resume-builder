import type { Basics, ResumeSection } from "@/types/resume";
import { createId } from "@/lib/resume/schema/factory";

/**
 * Heuristic resume parser.
 *
 * Resumes are semi-structured documents, so this reads like a human would:
 * find the headings, split each block into entries, then split entries into a
 * heading line, a sub-line and bullets. It is intentionally conservative — when
 * a block cannot be classified it is surfaced as an unmapped block for the user
 * to review rather than guessed at.
 */

export interface ParsedEntry {
  title: string;
  subtitle: string;
  date: string;
  location: string;
  bullets: string[];
  raw: string[];
}

export interface ParsedResume {
  basics: Partial<Basics>;
  headline: string;
  summary: string;
  experience: ParsedEntry[];
  education: ParsedEntry[];
  projects: ParsedEntry[];
  certifications: ParsedEntry[];
  achievements: ParsedEntry[];
  publications: ParsedEntry[];
  languages: string[];
  skills: string[];
  detected: string[];
  unmapped: { heading: string; lines: string[] }[];
  warnings: string[];
  confidence: number;
}

const HEADING_MAP: { key: keyof typeof BUCKETS; pattern: RegExp }[] = [];
const BUCKETS = {
  summary: "summary",
  experience: "experience",
  education: "education",
  skills: "skills",
  projects: "projects",
  certifications: "certifications",
  achievements: "achievements",
  publications: "publications",
  languages: "languages",
  volunteer: "experience",
  interests: "unmapped",
} as const;

const HEADINGS: { key: keyof typeof BUCKETS; pattern: RegExp }[] = [
  { key: "summary", pattern: /^(professional\s+)?(summary|profile|objective|about\s+me|about)\b/i },
  { key: "experience", pattern: /^((work|professional|employment|relevant)\s+)?(experience|history|employment)\b/i },
  { key: "experience", pattern: /^(work\s+experience|employment\s+history|career\s+history)$/i },
  { key: "education", pattern: /^(education|academic\s+background|qualifications|academics)\b/i },
  { key: "skills", pattern: /^(technical\s+)?(skills|core\s+competencies|expertise|technologies|tech\s+stack)\b/i },
  { key: "projects", pattern: /^(personal\s+|academic\s+|selected\s+)?projects\b/i },
  { key: "certifications", pattern: /^(certifications?|licenses?|courses?|training)\b/i },
  { key: "achievements", pattern: /^(achievements?|awards?|honors?|honours?|accomplishments?)\b/i },
  { key: "publications", pattern: /^(publications?|papers?|research|presentations?)\b/i },
  { key: "languages", pattern: /^languages?\b/i },
  { key: "interests", pattern: /^(interests|hobbies|activities)\b/i },
];

void HEADING_MAP;

const DATE_RANGE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*(?:19|20)\d{2}|\b(?:19|20)\d{2}|\d{1,2}\/(?:19|20)\d{2})\s*(?:-|–|—|to|until)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*(?:19|20)\d{2}|\b(?:19|20)\d{2}|\d{1,2}\/(?:19|20)\d{2}|present|current|now)/i;

const BULLET = /^\s*(?:[-–—•·▪◦*●○]|\d+[.)])\s+/;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,)]+/i;
const GITHUB = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,)]+/i;
const WEBSITE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:dev|com|io|me|net|org|co|in|app|ai|design|xyz)(?:\/[^\s,)]*)?/i;

const cleanLine = (line: string): string => line.replace(/\s+/g, " ").trim();

const stripBullet = (line: string): string => cleanLine(line.replace(BULLET, ""));

const isHeadingLine = (line: string): { key: keyof typeof BUCKETS } | null => {
  const value = cleanLine(line).replace(/[:\-–—]+$/, "");
  if (!value || value.length > 46) return null;
  const upperRatio = (value.match(/[A-Z]/g)?.length ?? 0) / Math.max(value.replace(/\s/g, "").length, 1);
  const looksLikeHeading = upperRatio > 0.55 || /^[A-Z][a-z]/.test(value);
  if (!looksLikeHeading) return null;
  const match = HEADINGS.find((h) => h.pattern.test(value));
  return match ? { key: match.key } : null;
};

const splitDate = (line: string): { text: string; date: string } => {
  const match = line.match(DATE_RANGE);
  if (!match) return { text: cleanLine(line), date: "" };
  const date = match[0].replace(/\s+/g, " ").trim();
  const text = cleanLine(line.replace(match[0], " ")).replace(/[|·—–,;]+$/, "").replace(/^[|·—–,;]+/, "").trim();
  return { text, date };
};

const splitSubtitle = (text: string): { title: string; subtitle: string; location: string } => {
  const parts = text.split(/\s+(?:—|–|\||·|@|at)\s+/i).map(cleanLine).filter(Boolean);
  if (parts.length === 1) return { title: parts[0] ?? "", subtitle: "", location: "" };
  const location = /^[A-Za-z .']+(?:,\s*[A-Za-z .]{2,})?$/.test(parts[parts.length - 1]) && parts.length > 2 ? parts.pop() ?? "" : "";
  return { title: parts[0] ?? "", subtitle: parts.slice(1).join(" · "), location };
};

const parseEntries = (lines: string[]): ParsedEntry[] => {
  const entries: ParsedEntry[] = [];
  let current: ParsedEntry | null = null;

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const isBullet = BULLET.test(rawLine);
    const hasDate = DATE_RANGE.test(line);

    if (!isBullet && (hasDate || !current || (current.bullets.length > 0 && line.length < 90))) {
      const { text, date } = splitDate(line);
      // A date alone on its line (title / company / dates stacked in three lines,
      // which is the most common export shape) belongs to the entry above it.
      if (date && !text.trim() && current && !current.date) {
        current.date = date;
        current.raw.push(line);
        continue;
      }
      const { title, subtitle, location } = splitSubtitle(text);
      // A candidate line that is clearly a continuation of the previous bullet.
      const looksLikeContinuation = Boolean(current && !hasDate && line.length > 90 && current.bullets.length > 0);
      if (!looksLikeContinuation && (title || date)) {
        if (current) entries.push(current);
        current = { title, subtitle, date, location, bullets: [], raw: [line] };
        continue;
      }
    }

    if (!current) {
      current = { title: "", subtitle: "", date: "", location: "", bullets: [], raw: [line] };
    }
    current.raw.push(rawLine);
    if (isBullet) current.bullets.push(stripBullet(rawLine));
    else if (!current.bullets.length) current.subtitle = cleanLine([current.subtitle, line].filter(Boolean).join(" · "));
    else current.bullets[current.bullets.length - 1] = `${current.bullets[current.bullets.length - 1]} ${line}`.trim();
  }
  if (current) entries.push(current);
  return entries.filter((entry) => entry.title || entry.subtitle || entry.bullets.length);
};

export const parseResumeText = (rawText: string): ParsedResume => {
  const warnings: string[] = [];
  const lines = rawText.replace(/\r\n?/g, "\n").split("\n");
  const blocks: { key: keyof typeof BUCKETS | "header"; lines: string[]; heading?: string }[] = [
    { key: "header", lines: [] },
  ];
  const detected: string[] = [];

  for (const line of lines) {
    const heading = isHeadingLine(line);
    if (heading) {
      blocks.push({ key: heading.key, lines: [], heading: cleanLine(line) });
      detected.push(cleanLine(line));
      continue;
    }
    blocks[blocks.length - 1].lines.push(line);
  }

  const headerLines = blocks[0].lines.map(cleanLine).filter(Boolean);
  const headerText = headerLines.join("\n");
  const basics: Partial<Basics> = {};

  const email = headerText.match(EMAIL)?.[0];
  if (email) basics.email = email;
  const phone = headerText.match(PHONE)?.[0];
  if (phone) basics.phone = phone.trim();
  const linkedin = headerText.match(LINKEDIN)?.[0];
  if (linkedin) basics.linkedin = linkedin.replace(/^https?:\/\//, "");
  const github = headerText.match(GITHUB)?.[0];
  if (github) basics.github = github.replace(/^https?:\/\//, "");

  const nameLine = headerLines.find((line) => {
    if (EMAIL.test(line) || PHONE.test(line)) return false;
    if (line.length > 46 || line.split(" ").length > 6) return false;
    return /^[A-Za-z][A-Za-z .'’-]+$/.test(line);
  });
  if (nameLine) basics.fullName = nameLine;

  const headlineLine = headerLines.find((line) => line !== nameLine && !EMAIL.test(line) && !PHONE.test(line) && line.length <= 90 && line.split(" ").length <= 12);
  const headline = headlineLine ?? "";

  const locationLine = headerLines.find(
    (line) => line !== nameLine && line !== headlineLine && /^[A-Za-z .'’-]+,\s*[A-Za-z .'’-]+$/.test(line),
  );
  if (locationLine) basics.location = locationLine;

  const websiteCandidate = headerText.match(WEBSITE)?.[0];
  if (websiteCandidate && !LINKEDIN.test(websiteCandidate) && !GITHUB.test(websiteCandidate) && !EMAIL.test(websiteCandidate)) {
    basics.website = websiteCandidate.replace(/^https?:\/\//, "");
  }

  const byKey = (key: keyof typeof BUCKETS) => blocks.filter((b) => b.key === key).flatMap((b) => b.lines);

  const summary = byKey("summary").map(cleanLine).filter(Boolean).join(" ");

  const experience = parseEntries(byKey("experience"));
  const education = parseEntries(byKey("education"));
  const projects = parseEntries(byKey("projects"));
  const certifications = parseEntries(byKey("certifications")).map((entry) => ({ ...entry, bullets: [] }));
  const achievements = parseEntries(byKey("achievements"));
  const publications = parseEntries(byKey("publications"));

  const skills = byKey("skills")
    .flatMap((line) => stripBullet(line).split(/[,;|·•]/))
    .map((token) => cleanLine(token).replace(/^[a-z ]+:/i, ""))
    .filter((token) => token.length > 1 && token.length < 40);

  const languages = byKey("languages")
    .flatMap((line) => stripBullet(line).split(/[,;|·•]/))
    .map(cleanLine)
    .filter((token) => token.length > 1 && token.length < 40);

  const unmapped = blocks
    .filter((block) => block.key !== "header" && BUCKETS[block.key] === "unmapped")
    .map((block) => ({
      heading: block.heading || "Unclassified section",
      lines: block.lines.map(cleanLine).filter(Boolean),
    }));

  const consumedHeaderLines = new Set([nameLine, headlineLine, locationLine].filter(Boolean) as string[]);
  const leftoverHeader = headerLines.filter((line) => !consumedHeaderLines.has(line) && !EMAIL.test(line) && !PHONE.test(line) && !LINKEDIN.test(line) && !GITHUB.test(line));
  if (leftoverHeader.length && !summary) {
    unmapped.push({ heading: "Header text", lines: leftoverHeader });
  }

  if (detected.length === 0) {
    warnings.push("No standard section headings were recognised. Everything was treated as one block — check the preview closely.");
  }
  if (!basics.email) warnings.push("No email address was found.");
  if (experience.length === 0) warnings.push("No work experience entries were detected.");
  if (skills.length === 0) warnings.push("No skills were detected.");
  warnings.push("Dates and job titles are best-effort guesses from text layout. Verify each entry before saving.");

  let confidence = 40;
  if (detected.length >= 3) confidence += 20;
  if (basics.email) confidence += 10;
  if (experience.length > 0) confidence += 15;
  if (skills.length > 0) confidence += 10;
  if (unmapped.length === 0) confidence += 5;
  confidence = Math.min(confidence, 95);

  return {
    basics,
    headline,
    summary,
    experience,
    education,
    projects,
    certifications,
    achievements,
    publications,
    languages,
    skills,
    detected,
    unmapped,
    warnings,
    confidence,
  };
};

/* ------------------------------------------------------------------ mapping */

const splitScore = (entry: ParsedEntry): string => {
  const match = entry.subtitle.match(/\b(?:cgpa|gpa|percentage|score)\b[^·|]*/i);
  return match?.[0]?.trim() ?? "";
};

export interface ParsedSelection {
  summary: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
  certifications: boolean;
  achievements: boolean;
  basics: boolean;
}

export const parsedToSections = (parsed: ParsedResume, selection: ParsedSelection): ResumeSection[] => {
  const sections: ResumeSection[] = [];

  if (selection.summary && parsed.summary.trim()) {
    sections.push({
      id: createId("summary"),
      kind: "summary",
      title: "Professional Summary",
      column: 0,
      visible: true,
      hideTitle: false,
      data: { text: parsed.summary },
    });
  }

  if (selection.experience && parsed.experience.length) {
    sections.push({
      id: createId("experience"),
      kind: "experience",
      title: "Work Experience",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: parsed.experience.map((entry) => ({
          id: createId("exp"),
          role: entry.title,
          company: entry.subtitle || "",
          location: entry.location,
          startDate: entry.date.split(/\s*(?:-|–|—|to|until)\s*/i)[0] ?? "",
          endDate: /present|current|now/i.test(entry.date) ? "" : (entry.date.split(/\s*(?:-|–|—|to|until)\s*/i)[1] ?? ""),
          current: /present|current|now/i.test(entry.date),
          description: "",
          bullets: entry.bullets.length ? entry.bullets : entry.raw.slice(1).map(cleanLine).filter(Boolean),
          tech: [],
        })),
      },
    });
  }

  if (selection.education && parsed.education.length) {
    sections.push({
      id: createId("education"),
      kind: "education",
      title: "Education",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: parsed.education.map((entry) => ({
          id: createId("edu"),
          degree: entry.title,
          institution: entry.subtitle,
          location: entry.location,
          startDate: entry.date.split(/\s*(?:-|–|—|to|until)\s*/i)[0] ?? "",
          endDate: entry.date.split(/\s*(?:-|–|—|to|until)\s*/i)[1] ?? "",
          score: splitScore(entry),
          details: entry.bullets,
        })),
      },
    });
  }

  if (selection.skills && parsed.skills.length) {
    sections.push({
      id: createId("skills"),
      kind: "skills",
      title: "Skills",
      column: parsed.languages.length ? 1 : 0,
      visible: true,
      hideTitle: false,
      data: { groups: [{ id: createId("grp"), name: "Skills", items: parsed.skills.slice(0, 40) }], display: "inline" },
    });
  }

  if (selection.projects && parsed.projects.length) {
    sections.push({
      id: createId("projects"),
      kind: "projects",
      title: "Projects",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: parsed.projects.map((entry) => ({
          id: createId("prj"),
          name: entry.title,
          role: entry.subtitle,
          url: entry.raw.join(" ").match(/(?:https?:\/\/)?[\w.-]+\.(?:com|dev|io|app|net|org)[^\s)]*/)?.[0] ?? "",
          startDate: entry.date,
          endDate: "",
          description: "",
          bullets: entry.bullets,
          tech: [],
        })),
      },
    });
  }

  if (selection.certifications && parsed.certifications.length) {
    sections.push({
      id: createId("certifications"),
      kind: "certifications",
      title: "Certifications",
      column: 1,
      visible: true,
      hideTitle: false,
      data: {
        items: parsed.certifications.map((entry) => ({
          id: createId("cert"),
          name: entry.title || entry.subtitle,
          issuer: entry.title ? entry.subtitle : "",
          date: entry.date,
          url: "",
        })),
      },
    });
  }

  if (selection.achievements && parsed.achievements.length) {
    sections.push({
      id: createId("achievements"),
      kind: "achievements",
      title: "Achievements",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: parsed.achievements.map((entry) => ({
          id: createId("ach"),
          title: entry.title || entry.subtitle,
          issuer: entry.title ? entry.subtitle : "",
          date: entry.date,
          description: entry.bullets.join(" "),
        })),
      },
    });
  }

  if (parsed.languages.length) {
    sections.push({
      id: createId("languages"),
      kind: "languages",
      title: "Languages",
      column: 1,
      visible: true,
      hideTitle: false,
      data: {
        items: parsed.languages.map((entry) => {
          const [name, proficiency = ""] = entry.split(/\s*[-–(:]\s*/);
          return { id: createId("lang"), name: name.trim(), proficiency: proficiency.replace(/\)$/, "").trim() };
        }),
        display: "inline",
      },
    });
  }

  return sections;
};
