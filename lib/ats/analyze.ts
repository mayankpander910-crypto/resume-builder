import type { ResumeDocument } from "@/types/resume";
import { resumeToPlainText } from "@/lib/resume/renderer/plain-text";
import { getTemplate } from "@/lib/templates/registry";

/**
 * Heuristic ATS analysis.
 *
 * This is our own scoring model — not the output of any commercial ATS. It
 * checks the things that empirically break parsers and recruiter screening:
 * structure, contactability, bullet quality, keyword coverage and formatting
 * risk. It runs entirely in the browser; the resume never leaves the device.
 */

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  weight: number;
  detail: string;
  fix?: string;
}

export interface SectionResult {
  name: string;
  present: boolean;
  quality: number;
  notes: string[];
}

export interface KeywordResult {
  matched: string[];
  missing: string[];
  coverage: number;
  topJobTerms: { term: string; count: number }[];
}

export interface BulletIssue {
  text: string;
  reason: string;
  section: string;
}

export interface AtsReport {
  score: number;
  band: "excellent" | "good" | "fair" | "needs work";
  generatedAt: string;
  disclaimer: string;
  checks: Check[];
  sections: SectionResult[];
  keywords: KeywordResult | null;
  bulletIssues: BulletIssue[];
  strengths: string[];
  recommendations: string[];
  stats: {
    words: number;
    bullets: number;
    quantifiedBullets: number;
    avgBulletWords: number;
    estimatedPages: number;
    template: string;
    atsTemplateScore: number;
  };
}

const STOPWORDS = new Set(
  `a an and are as at be been being but by can could did do does doing for from had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours team work working works experience experiences role roles job ability skills skill also using use used well across within without per plus etc via etc. candidate candidates company companies please apply applicants position positions new including include includes ensure ensuring support supporting help helping various strong excellent good great must required preferred requirements responsibilities qualifications years year month months day days time full part`.split(
    /\s+/,
  ),
);

const ACTION_VERBS = new Set(
  `achieved acquired adapted administered advanced advised analysed analyzed built budgeted coached collaborated conducted configured consolidated constructed converted coordinated created cut decreased defined delivered demonstrated deployed designed developed diagnosed directed discovered documented doubled drove earned eliminated enabled engineered established evaluated expanded facilitated forecast founded generated grew guided hired identified implemented improved increased influenced initiated instituted integrated introduced launched led leveraged maintained managed mapped mentored migrated modernised modernized monitored negotiated onboarded operated optimised optimized orchestrated organised organized overhauled owned partnered performed piloted planned reduced refined reorganized researched resolved restructured revised saved scaled scoped secured shipped simplified sold spearheaded standardised standardized streamlined strengthened supported surveyed sustained tested trained transformed translated tripled uncovered unified validated`.split(
    /\s+/,
  ),
);

const WEAK_OPENERS = [
  "responsible for",
  "worked on",
  "helped with",
  "helped to",
  "involved in",
  "assisted with",
  "duties included",
  "tasked with",
  "participated in",
  "in charge of",
];

const BUZZWORDS = ["team player", "hard worker", "passionate", "results-driven", "go-getter", "think outside the box", "synergy", "dynamic professional", "self-starter"];

const words = (text: string): string[] => text.toLowerCase().match(/[a-z0-9+#.\-/]+/g) ?? [];

const tokenize = (text: string): string[] => words(text).filter((w) => w.length > 1);

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const bulletText = (doc: ResumeDocument): { text: string; section: string }[] => {
  const out: { text: string; section: string }[] = [];
  for (const section of doc.sections) {
    if (!section.visible) continue;
    if (section.kind === "experience" || section.kind === "volunteer" || section.kind === "projects") {
      for (const item of section.data.items) {
        for (const bullet of item.bullets) {
          if (bullet.trim()) out.push({ text: bullet.trim(), section: section.title });
        }
        if (section.kind === "projects" && item.description.trim()) {
          out.push({ text: item.description.trim(), section: section.title });
        }
      }
    }
    if (section.kind === "custom") {
      for (const item of section.data.items) {
        for (const bullet of item.bullets) if (bullet.trim()) out.push({ text: bullet.trim(), section: section.title });
      }
    }
    if (section.kind === "education") {
      for (const item of section.data.items) for (const detail of item.details) if (detail.trim()) out.push({ text: detail.trim(), section: section.title });
    }
  }
  return out;
};

const hasQuantification = (text: string): boolean => /\d/.test(text) || /\b(two|three|four|five|ten|hundred|thousand|million|dozen)\b/i.test(text);

const estimatePages = (doc: ResumeDocument, wordCount: number): number => {
  const density = doc.theme.density === "compact" ? 620 : doc.theme.density === "relaxed" ? 430 : 520;
  return Math.max(1, Math.ceil(wordCount / density));
};

/* ---------------------------------------------------------------- keywords */

export const extractKeywords = (jobDescription: string, limit = 24): { term: string; count: number }[] => {
  const tokens = tokenize(jobDescription);
  const counts = new Map<string, number>();
  const bigrams = new Map<string, number>();

  tokens.forEach((token, index) => {
    if (token.length < 3 || STOPWORDS.has(token) || /^\d+$/.test(token)) return;
    counts.set(token, (counts.get(token) ?? 0) + 1);
    const next = tokens[index + 1];
    if (next && next.length > 2 && !STOPWORDS.has(next) && !/^\d+$/.test(next)) {
      const phrase = `${token} ${next}`;
      bigrams.set(phrase, (bigrams.get(phrase) ?? 0) + 1);
    }
  });

  const scored = [
    ...[...bigrams.entries()].filter(([, count]) => count >= 2).map(([term, count]) => ({ term, count: count * 2.2 })),
    ...[...counts.entries()].map(([term, count]) => ({ term, count })),
  ];
  scored.sort((a, b) => b.count - a.count);

  const seen = new Set<string>();
  const result: { term: string; count: number }[] = [];
  for (const entry of scored) {
    if (seen.has(entry.term)) continue;
    // Skip single words already covered by a chosen phrase.
    if (!entry.term.includes(" ") && [...seen].some((phrase) => phrase.includes(entry.term))) continue;
    seen.add(entry.term);
    result.push({ term: entry.term, count: Math.round(entry.count) });
    if (result.length >= limit) break;
  }
  return result;
};

const compareKeywords = (doc: ResumeDocument, jobDescription: string): KeywordResult => {
  const resumeText = resumeToPlainText(doc).toLowerCase();
  const topJobTerms = extractKeywords(jobDescription);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const { term } of topJobTerms) {
    if (resumeText.includes(term.toLowerCase())) matched.push(term);
    else missing.push(term);
  }
  const coverage = topJobTerms.length ? Math.round((matched.length / topJobTerms.length) * 100) : 0;
  return { matched, missing, coverage, topJobTerms };
};

/* ------------------------------------------------------------------- checks */

const evaluateBullet = (text: string): { ok: boolean; reason?: string } => {
  const lower = text.toLowerCase();
  const wordCount = tokenize(text).length;
  if (wordCount < 4) return { ok: false, reason: "Too short to show what you actually did." };
  if (wordCount > 34) return { ok: false, reason: "Long run-on sentence — split it into two points." };
  const weak = WEAK_OPENERS.find((phrase) => lower.startsWith(phrase));
  if (weak) return { ok: false, reason: `Begins with "${weak}" — lead with the action instead.` };
  const first = tokenize(text)[0] ?? "";
  if (first && !ACTION_VERBS.has(first) && !/^[a-z]+ing$/.test(first) && !/^[a-z]+ed$/.test(first)) {
    return { ok: false, reason: `Starts with "${first}" — try a concrete verb.` };
  }
  const buzz = BUZZWORDS.find((phrase) => lower.includes(phrase));
  if (buzz) return { ok: false, reason: `Contains the cliché "${buzz}".` };
  if (/\b(i|my|me)\b/.test(lower)) return { ok: false, reason: "Uses first person; resumes read better in implied first person." };
  return { ok: true };
};

export const analyzeResume = (doc: ResumeDocument, options: { jobDescription?: string } = {}): AtsReport => {
  const template = getTemplate(doc.meta.templateId);
  const plain = resumeToPlainText(doc);
  const allWords = tokenize(plain);
  const bullets = bulletText(doc);
  const checks: Check[] = [];
  const sections: SectionResult[] = [];
  const recommendations: string[] = [];
  const strengths: string[] = [];

  /* contact */
  const emailOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(doc.basics.email);
  const phoneOk = doc.basics.phone.replace(/\D/g, "").length >= 7;
  const hasLocation = doc.basics.location.trim().length > 1;
  const contactCount = [emailOk, phoneOk, hasLocation, Boolean(doc.basics.linkedin || doc.basics.website || doc.basics.github)].filter(Boolean).length;
  checks.push({
    id: "contact",
    label: "Contact information",
    status: !emailOk ? "fail" : !phoneOk ? "warn" : contactCount >= 3 ? "pass" : "warn",
    weight: 12,
    detail: !emailOk
      ? "A valid email address was not detected. Most parsers key the whole record off this field."
      : `Found ${contactCount} of 4 contact signals (email, phone, location, professional link).`,
    fix: !emailOk ? "Add a personal email address in standard format, e.g. firstname.lastname@mail.com." : undefined,
  });
  if (contactCount >= 3) strengths.push("Contact block is complete and machine-readable.");

  /* structure */
  const visibleKinds = new Set(doc.sections.filter((s) => s.visible).map((s) => s.kind));
  const wanted: { kind: string; label: string; required: boolean }[] = [
    { kind: "summary", label: "Summary", required: false },
    { kind: "experience", label: "Experience", required: true },
    { kind: "education", label: "Education", required: true },
    { kind: "skills", label: "Skills", required: true },
    { kind: "projects", label: "Projects", required: false },
    { kind: "certifications", label: "Certifications", required: false },
  ];
  const requiredMissing = wanted.filter((w) => w.required && !visibleKinds.has(w.kind as never)).map((w) => w.label);
  checks.push({
    id: "sections",
    label: "Core sections present",
    status: requiredMissing.length === 0 ? "pass" : requiredMissing.length === 1 ? "warn" : "fail",
    weight: 14,
    detail:
      requiredMissing.length === 0
        ? "Experience, education and skills are all present with standard headings."
        : `Missing: ${requiredMissing.join(", ")}.`,
    fix: requiredMissing.length ? "Add the missing section — parsers look for these headings by name." : undefined,
  });
  if (requiredMissing.length === 0) strengths.push("All three sections every parser expects are present.");

  /* summary */
  const summary = doc.sections.find((s) => s.kind === "summary");
  const summaryWords = summary && summary.kind === "summary" ? tokenize(summary.data.text).length : 0;
  sections.push({
    name: "Professional summary",
    present: summaryWords > 0,
    quality: summaryWords === 0 ? 0 : summaryWords < 20 ? 55 : summaryWords <= 90 ? 95 : 70,
    notes:
      summaryWords === 0
        ? ["No summary yet. Two to four lines is enough for most roles."]
        : summaryWords > 90
          ? ["Longer than a recruiter will read in a first pass — aim for under 90 words."]
          : ["Length is in the range recruiters actually read."],
  });

  /* experience quality */
  const experience = doc.sections.find((s) => s.kind === "experience");
  let experienceQuality = 0;
  if (experience && experience.kind === "experience") {
    const items = experience.data.items.filter((i) => i.role.trim() || i.company.trim());
    const withBullets = items.filter((i) => i.bullets.filter((b) => b.trim()).length > 0).length;
    const withDates = items.filter((i) => i.startDate.trim() && (i.endDate.trim() || i.current)).length;
    experienceQuality = clamp(
      (items.length ? 30 : 0) + (items.length ? (withBullets / items.length) * 40 : 0) + (items.length ? (withDates / items.length) * 30 : 0),
    );
    sections.push({
      name: "Work experience",
      present: items.length > 0,
      quality: experienceQuality,
      notes: [
        items.length === 0 ? "No roles added yet." : `${items.length} role(s), ${withBullets} with bullet points.`,
        withDates < items.length ? "Some roles are missing start/end dates, which weakens chronology checks." : "Every role has a date range.",
      ],
    });
  } else {
    sections.push({ name: "Work experience", present: false, quality: 0, notes: ["No experience section."] });
  }

  /* education + skills */
  const education = doc.sections.find((s) => s.kind === "education");
  const educationItems = education && education.kind === "education" ? education.data.items.filter((i) => i.degree.trim() || i.institution.trim()).length : 0;
  sections.push({
    name: "Education",
    present: educationItems > 0,
    quality: educationItems > 0 ? 90 : 0,
    notes: educationItems > 0 ? ["Degree and institution present."] : ["Add your highest qualification — it is checked for many roles."],
  });

  const skills = doc.sections.find((s) => s.kind === "skills");
  const skillCount = skills && skills.kind === "skills" ? skills.data.groups.reduce((total, group) => total + group.items.length, 0) : 0;
  sections.push({
    name: "Skills",
    present: skillCount > 0,
    quality: skillCount === 0 ? 0 : skillCount < 5 ? 55 : skillCount <= 24 ? 95 : 75,
    notes:
      skillCount === 0
        ? ["No skills listed — keyword matching will suffer."]
        : skillCount > 24
          ? [`${skillCount} skills listed. Past ~20 the list stops being read; keep what you can defend.`]
          : [`${skillCount} skills listed, which parses cleanly.`],
  });

  /* bullet quality */
  const bulletIssues: BulletIssue[] = [];
  for (const bullet of bullets) {
    const result = evaluateBullet(bullet.text);
    if (!result.ok && result.reason) bulletIssues.push({ text: bullet.text, reason: result.reason, section: bullet.section });
  }
  const quantified = bullets.filter((b) => hasQuantification(b.text)).length;
  const weakRatio = bullets.length ? bulletIssues.length / bullets.length : 0;
  checks.push({
    id: "bullets",
    label: "Bullet point quality",
    status: bullets.length === 0 ? "fail" : weakRatio > 0.5 ? "fail" : weakRatio > 0.25 ? "warn" : "pass",
    weight: 20,
    detail:
      bullets.length === 0
        ? "No bullet points found. Recruiters scan bullets, not paragraphs."
        : `${bullets.length} bullets reviewed, ${bulletIssues.length} flagged, ${quantified} contain a number.`,
    fix: bulletIssues.length ? "Start each bullet with a verb and describe the outcome where you know it." : undefined,
  });
  if (bullets.length >= 4 && weakRatio <= 0.15) strengths.push("Bullet points lead with actions and avoid filler phrasing.");

  /* quantification */
  const quantRatio = bullets.length ? quantified / bullets.length : 0;
  checks.push({
    id: "quantified",
    label: "Measurable outcomes",
    status: quantRatio >= 0.35 ? "pass" : quantRatio > 0.1 ? "warn" : "info",
    weight: 10,
    detail:
      quantRatio >= 0.35
        ? `${Math.round(quantRatio * 100)}% of bullets include a number, scale or scope.`
        : "Few bullets include a number, scale or scope. Add only figures you can defend.",
    fix: quantRatio < 0.35 ? "Where you know the real figure, add it: users, revenue, latency, team size, volume." : undefined,
  });

  /* formatting risk from template */
  checks.push({
    id: "format",
    label: "Parser-safe formatting",
    status: template.atsScore >= 90 ? "pass" : template.atsScore >= 78 ? "warn" : "fail",
    weight: 14,
    detail:
      template.atsScore >= 90
        ? `${template.name} is single-column with standard headings — the safest shape for parsers.`
        : `${template.name} uses a ${template.columns}-column layout${template.columns > 1 ? " which some parsers read out of order" : ""}. Consider an ATS-first template when applying through a portal.`,
    fix: template.atsScore < 90 ? "Switch to the Meridian or Northwind Minimal template for portal applications." : undefined,
  });

  /* length */
  const pages = estimatePages(doc, allWords.length);
  checks.push({
    id: "length",
    label: "Resume length",
    status: allWords.length < 180 ? "warn" : pages <= 2 ? "pass" : pages === 3 ? "warn" : "fail",
    weight: 8,
    detail:
      allWords.length < 180
        ? `Only ${allWords.length} words — most resumes need 350–750.`
        : `About ${allWords.length} words, roughly ${pages} page(s).`,
    fix: pages > 2 ? "For most roles, two pages is the ceiling. Move older work to a one-line entry." : undefined,
  });

  /* keywords */
  const keywords = options.jobDescription && options.jobDescription.trim().length > 30 ? compareKeywords(doc, options.jobDescription) : null;
  if (keywords) {
    checks.push({
      id: "keywords",
      label: "Job description keyword coverage",
      status: keywords.coverage >= 65 ? "pass" : keywords.coverage >= 40 ? "warn" : "fail",
      weight: 16,
      detail: `Matched ${keywords.matched.length} of ${keywords.matched.length + keywords.missing.length} key terms the posting repeats.`,
      fix: keywords.missing.length ? "Work the highest-value missing terms into real sentences — never as a keyword list." : undefined,
    });
    if (keywords.coverage >= 60) strengths.push("Strong vocabulary overlap with the posting.");
  }

  /* dates consistency */
  const dateStyles = new Set<string>();
  for (const section of doc.sections) {
    if (section.kind === "experience" || section.kind === "education" || section.kind === "volunteer") {
      for (const item of section.data.items) {
        const value = item.startDate.trim();
        if (!value) continue;
        if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(value)) dateStyles.add("month-year");
        else if (/^\d{4}$/.test(value)) dateStyles.add("year");
        else if (/^\d{2}\/\d{4}$/.test(value)) dateStyles.add("slash");
        else dateStyles.add("other");
      }
    }
  }
  checks.push({
    id: "dates",
    label: "Date consistency",
    status: dateStyles.size <= 1 ? "pass" : dateStyles.size === 2 ? "warn" : "fail",
    weight: 6,
    detail: dateStyles.size <= 1 ? "Date formats are consistent across the document." : `Found ${dateStyles.size} different date formats.`,
    fix: dateStyles.size > 1 ? 'Pick one format — "Mar 2022" or "2022" — and use it everywhere.' : undefined,
  });

  /* headline */
  const headline = doc.basics.headline.trim();
  checks.push({
    id: "headline",
    label: "Targeted headline",
    status: !headline ? "warn" : headline.length < 6 ? "warn" : headline.length > 95 ? "warn" : "pass",
    weight: 5,
    detail: !headline
      ? "No headline under your name. Many parsers surface it as the candidate's current title."
      : `Headline is ${headline.length} characters — ${headline.length > 95 ? "long enough to wrap" : "a readable length"}.`,
    fix: !headline ? "Add a headline that names the role you are applying for, e.g. \"Senior Backend Engineer · Payments\"." : undefined,
  });

  /* summary depth */
  const summarySection = doc.sections.find((section) => section.kind === "summary" && section.visible);
  const headlineSummaryWords = summarySection && summarySection.kind === "summary" ? tokenize(summarySection.data.text).length : 0;
  checks.push({
    id: "summary",
    label: "Summary depth",
    status: headlineSummaryWords === 0 ? "warn" : headlineSummaryWords < 20 ? "warn" : headlineSummaryWords > 120 ? "warn" : "pass",
    weight: 7,
    detail:
      headlineSummaryWords === 0
        ? "No summary text — the first thing a human reads is missing."
        : `Summary is ${headlineSummaryWords} words; 30–90 is the useful band.`,
    fix: headlineSummaryWords === 0 ? "Write three sentences: what you do, the scale you work at, and what you want next." : undefined,
  });

  /* skills depth */
  const skillItems = doc.sections
    .filter((section) => section.kind === "skills" && section.visible)
    .flatMap((section) => (section.kind === "skills" ? section.data.groups.flatMap((group) => group.items) : []))
    .filter((item) => item.trim().length > 0);
  const skillGroups = doc.sections
    .filter((section) => section.kind === "skills" && section.visible)
    .flatMap((section) => (section.kind === "skills" ? section.data.groups.filter((group) => group.items.length > 0) : []));
  checks.push({
    id: "skills-depth",
    label: "Skills coverage",
    status: skillItems.length === 0 ? "fail" : skillItems.length < 6 ? "warn" : skillGroups.length >= 2 ? "pass" : "warn",
    weight: 8,
    detail:
      skillItems.length === 0
        ? "No skills listed. Keyword matching happens here first."
        : `${skillItems.length} skills in ${skillGroups.length} group(s).${skillGroups.length < 2 ? " Grouping them by type reads better." : ""}`,
    fix: skillItems.length < 6 ? "List the tools and methods the posting names, where you have actually used them." : undefined,
  });

  /* education detail */
  const eduEntries = doc.sections
    .filter((section) => section.kind === "education" && section.visible)
    .flatMap((section) => (section.kind === "education" ? section.data.items : []));
  const eduComplete = eduEntries.filter((item) => item.institution.trim() && (item.endDate.trim() || item.startDate.trim())).length;
  checks.push({
    id: "education-detail",
    label: "Education completeness",
    status: eduEntries.length === 0 ? "warn" : eduComplete === eduEntries.length ? "pass" : "warn",
    weight: 5,
    detail:
      eduEntries.length === 0
        ? "No education entries. Add the qualification even if it is old."
        : `${eduComplete} of ${eduEntries.length} entries have both an institution and a date.`,
    fix: eduComplete < eduEntries.length ? "Give every qualification an institution name and a year." : undefined,
  });

  /* employment dates */
  const experienceItems = doc.sections
    .filter((section) => (section.kind === "experience" || section.kind === "volunteer") && section.visible)
    .flatMap((section) => (section.kind === "experience" || section.kind === "volunteer" ? section.data.items : []));
  const undated = experienceItems.filter((item) => !item.startDate.trim() || (!item.endDate.trim() && !item.current)).length;
  checks.push({
    id: "date-coverage",
    label: "Complete role dates",
    status: experienceItems.length === 0 ? "warn" : undated === 0 ? "pass" : undated === 1 ? "warn" : "fail",
    weight: 8,
    detail:
      experienceItems.length === 0
        ? "No work history entries found."
        : undated === 0
          ? `All ${experienceItems.length} roles have a start and an end (or are marked current).`
          : `${undated} of ${experienceItems.length} roles are missing a start or end date.`,
    fix: undated ? "Give every role a start date, and either an end date or the current-role flag." : undefined,
  });

  /* action verb openers */
  const verbOpeners = bullets.filter((bullet) => ACTION_VERBS.has((tokenize(bullet.text)[0] ?? "").toLowerCase())).length;
  const verbRatio = bullets.length ? verbOpeners / bullets.length : 0;
  checks.push({
    id: "action-verbs",
    label: "Action-verb openers",
    status: bullets.length === 0 ? "info" : verbRatio >= 0.6 ? "pass" : verbRatio >= 0.35 ? "warn" : "fail",
    weight: 9,
    detail: bullets.length
      ? `${verbOpeners} of ${bullets.length} bullets open with a strong verb (${Math.round(verbRatio * 100)}%).`
      : "No bullets to evaluate.",
    fix: verbRatio < 0.6 && bullets.length ? "Open with the verb: \"Rebuilt\", \"Reduced\", \"Shipped\" — not \"Responsible for\"." : undefined,
  });

  /* bullet length */
  const avgBulletWords = bullets.length ? bullets.reduce((sum, bullet) => sum + tokenize(bullet.text).length, 0) / bullets.length : 0;
  checks.push({
    id: "bullet-length",
    label: "Bullet length",
    status: bullets.length === 0 ? "info" : avgBulletWords < 8 ? "warn" : avgBulletWords > 30 ? "warn" : "pass",
    weight: 5,
    detail: bullets.length
      ? `Average bullet length is ${Math.round(avgBulletWords)} words; 12–24 reads best on a printed page.`
      : "No bullets to measure.",
    fix: avgBulletWords > 30 ? "Split the longest bullets — one idea per line." : undefined,
  });

  /* first person */
  const firstPersonMatches = plain.match(/\b(I|my|me|mine|myself)\b/g) ?? [];
  checks.push({
    id: "first-person",
    label: "Third-person phrasing",
    status: firstPersonMatches.length === 0 ? "pass" : firstPersonMatches.length <= 2 ? "warn" : "fail",
    weight: 5,
    detail:
      firstPersonMatches.length === 0
        ? "No first-person pronouns — the conventional resume voice."
        : `${firstPersonMatches.length} first-person pronoun(s) found (${firstPersonMatches.slice(0, 4).join(", ")}).`,
    fix: firstPersonMatches.length ? "Drop \"I\" and \"my\": \"I rebuilt the pipeline\" becomes \"Rebuilt the pipeline\"." : undefined,
  });

  /* duplicate content */
  const normalisedBullets = bullets.map((bullet) => bullet.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim());
  const duplicateCount = normalisedBullets.length - new Set(normalisedBullets).size;
  checks.push({
    id: "duplicates",
    label: "No repeated lines",
    status: duplicateCount === 0 ? "pass" : duplicateCount <= 1 ? "warn" : "fail",
    weight: 4,
    detail: duplicateCount === 0 ? "No duplicate bullets." : `${duplicateCount} bullet(s) repeat text used elsewhere.`,
    fix: duplicateCount ? "Each bullet should say something new; cut the repeats." : undefined,
  });

  /* placeholders */
  const PLACEHOLDERS = /lorem ipsum|your name|job title here|company name|tbd|xxx+|insert |placeholder/i;
  const placeholderHits = PLACEHOLDERS.test(plain) ? (plain.match(PLACEHOLDERS) ?? []).slice(0, 3) : [];
  checks.push({
    id: "placeholders",
    label: "No placeholder text",
    status: placeholderHits.length === 0 ? "pass" : "fail",
    weight: 10,
    detail: placeholderHits.length === 0 ? "Nothing that looks like template filler." : `Placeholder text found: ${placeholderHits.join(", ")}.`,
    fix: placeholderHits.length ? "Remove the leftover sample text before exporting." : undefined,
  });

  /* professional links */
  const linkCount = [doc.basics.linkedin, doc.basics.website, doc.basics.github].filter((value) => value.trim().length > 2).length;
  checks.push({
    id: "links",
    label: "Professional links",
    status: linkCount >= 1 ? "pass" : "info",
    weight: 4,
    detail: linkCount ? `${linkCount} link(s) attached to the header.` : "No profile links. Optional, but useful for technical and design roles.",
    fix: linkCount ? undefined : "Add a LinkedIn URL, portfolio or GitHub handle if it is current.",
  });

  /* aggregate */
  let score = 0;
  let totalWeight = 0;
  for (const check of checks) {
    totalWeight += check.weight;
    if (check.status === "pass") score += check.weight;
    else if (check.status === "warn") score += check.weight * 0.55;
    else if (check.status === "info") score += check.weight * 0.7;
  }
  let normalized = totalWeight ? clamp(Math.round((score / totalWeight) * 100)) : 0;
  // Section completeness nudges the result without dominating it.
  const sectionAverage = sections.length ? sections.reduce((sum, s) => sum + s.quality, 0) / sections.length : 0;
  normalized = clamp(Math.round(normalized * 0.82 + sectionAverage * 0.18));

  for (const check of checks) {
    if ((check.status === "fail" || check.status === "warn") && check.fix) recommendations.push(check.fix);
  }
  if (keywords && keywords.missing.length) {
    recommendations.push(`Consider adding: ${keywords.missing.slice(0, 6).join(", ")} — only where the claim is true.`);
  }
  if (bulletIssues.length) recommendations.push(`Rewrite ${bulletIssues.length} flagged bullet(s) with an action verb and a specific detail.`);

  const band: AtsReport["band"] = normalized >= 85 ? "excellent" : normalized >= 70 ? "good" : normalized >= 55 ? "fair" : "needs work";

  return {
    score: normalized,
    band,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "This score is Resume Forge's own heuristic, computed in your browser. It is not a score from any employer's applicant tracking system and does not predict hiring outcomes.",
    checks,
    sections,
    keywords,
    bulletIssues,
    strengths,
    recommendations: recommendations.slice(0, 10),
    stats: {
      words: allWords.length,
      bullets: bullets.length,
      quantifiedBullets: quantified,
      avgBulletWords: bullets.length ? Math.round(bullets.reduce((sum, b) => sum + tokenize(b.text).length, 0) / bullets.length) : 0,
      estimatedPages: pages,
      template: template.name,
      atsTemplateScore: template.atsScore,
    },
  };
};

/** Analyses pasted plain text (no structured document available). */
export const analyzePlainText = (text: string, options: { jobDescription?: string } = {}): AtsReport => {
  const tokens = tokenize(text);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^[-•*·▪]/.test(l)).map((l) => l.replace(/^[-•*·▪]\s*/, ""));
  const issues: BulletIssue[] = [];
  for (const bullet of bulletLines) {
    const result = evaluateBullet(bullet);
    if (!result.ok && result.reason) issues.push({ text: bullet, reason: result.reason, section: "Imported text" });
  }
  const keywords = options.jobDescription && options.jobDescription.trim().length > 30 ? (() => {
    const lower = text.toLowerCase();
    const top = extractKeywords(options.jobDescription);
    const matched = top.filter((t) => lower.includes(t.term)).map((t) => t.term);
    const missing = top.filter((t) => !lower.includes(t.term)).map((t) => t.term);
    return { matched, missing, coverage: top.length ? Math.round((matched.length / top.length) * 100) : 0, topJobTerms: top };
  })() : null;

  const hasEmail = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text);
  const hasPhone = (text.match(/\d/g)?.length ?? 0) >= 7;
  const checks: Check[] = [
    {
      id: "contact",
      label: "Contact information",
      status: hasEmail ? "pass" : "fail",
      weight: 16,
      detail: hasEmail ? "An email address was found in the text." : "No email address found — the parser may discard the record.",
      fix: hasEmail ? undefined : "Include an email address as plain text near the top.",
    },
    {
      id: "phone",
      label: "Phone number",
      status: hasPhone ? "pass" : "warn",
      weight: 8,
      detail: hasPhone ? "A phone number appears present." : "No phone number detected.",
    },
    {
      id: "bullets",
      label: "Bullet point quality",
      status: bulletLines.length === 0 ? "warn" : issues.length / bulletLines.length > 0.4 ? "warn" : "pass",
      weight: 20,
      detail:
        bulletLines.length === 0
          ? "No bullet points detected in the pasted text — formatting may have been lost."
          : `${bulletLines.length} bullets detected, ${issues.length} flagged.`,
    },
    {
      id: "headings",
      label: "Standard section headings",
      status: /(experience|education|skills)/i.test(text) ? "pass" : "warn",
      weight: 18,
      detail: /(experience|education|skills)/i.test(text)
        ? "Recognisable section headings found."
        : "No standard headings found; parsers rely on words like Experience and Education.",
    },
    {
      id: "length",
      label: "Resume length",
      status: tokens.length < 150 ? "warn" : tokens.length <= 900 ? "pass" : "warn",
      weight: 8,
      detail: `${tokens.length} words in the pasted text.`,
    },
    {
      id: "action-verbs",
      label: "Action-verb openers",
      status: bulletLines.length === 0 ? "info" : (() => {
        const verbs = bulletLines.filter((line) => ACTION_VERBS.has((tokenize(line)[0] ?? "").toLowerCase())).length;
        const ratio = verbs / bulletLines.length;
        return ratio >= 0.6 ? "pass" : ratio >= 0.35 ? "warn" : "fail";
      })(),
      weight: 9,
      detail: `${bulletLines.filter((line) => ACTION_VERBS.has((tokenize(line)[0] ?? "").toLowerCase())).length} of ${bulletLines.length} bullets open with a strong verb.`,
      fix: bulletLines.length ? "Open each bullet with a verb rather than a noun phrase." : undefined,
    },
    {
      id: "quantified",
      label: "Measurable outcomes",
      status: (() => {
        const quantified = bulletLines.filter((line) => hasQuantification(line)).length;
        const ratio = bulletLines.length ? quantified / bulletLines.length : 0;
        return ratio >= 0.35 ? "pass" : ratio > 0.1 ? "warn" : "info";
      })(),
      weight: 10,
      detail: `${bulletLines.filter((line) => hasQuantification(line)).length} of ${bulletLines.length} bullets contain a number or scale.`,
    },
    {
      id: "first-person",
      label: "Third-person phrasing",
      status: (() => {
        const hits = text.match(/\b(I|my|me|mine|myself)\b/g)?.length ?? 0;
        return hits === 0 ? "pass" : hits <= 2 ? "warn" : "fail";
      })(),
      weight: 5,
      detail: `${text.match(/\b(I|my|me|mine|myself)\b/g)?.length ?? 0} first-person pronoun(s) found.`,
    },
    {
      id: "dates",
      label: "Date formats",
      status: (() => {
        const formats = new Set<string>();
        for (const line of lines) {
          if (/\b[A-Za-z]{3,9}\s+\d{4}\b/.test(line)) formats.add("month-year");
          if (/\b(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present)\b/i.test(line)) formats.add("year-range");
          if (/\b\d{1,2}\/(19|20)\d{2}\b/.test(line)) formats.add("slash");
        }
        return formats.size <= 1 ? "pass" : formats.size === 2 ? "warn" : "fail";
      })(),
      weight: 6,
      detail: (() => {
        const formats = new Set<string>();
        for (const line of lines) {
          if (/\b[A-Za-z]{3,9}\s+\d{4}\b/.test(line)) formats.add("month-year");
          if (/\b(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present)\b/i.test(line)) formats.add("year-range");
          if (/\b\d{1,2}\/(19|20)\d{2}\b/.test(line)) formats.add("slash");
        }
        return formats.size <= 1 ? "Date style is consistent." : `${formats.size} different date styles detected.`;
      })(),
    },
    {
      id: "duplicates",
      label: "No repeated lines",
      status: (() => {
        const normalised = bulletLines.map((line) => line.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim());
        const dupes = normalised.length - new Set(normalised).size;
        return dupes === 0 ? "pass" : dupes <= 1 ? "warn" : "fail";
      })(),
      weight: 4,
      detail: (() => {
        const normalised = bulletLines.map((line) => line.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim());
        const dupes = normalised.length - new Set(normalised).size;
        return dupes === 0 ? "No duplicate bullets." : `${dupes} repeated bullet(s).`;
      })(),
    },
    {
      id: "placeholders",
      label: "No placeholder text",
      status: /lorem ipsum|your name|job title here|company name|tbd|insert /i.test(text) ? "fail" : "pass",
      weight: 10,
      detail: /lorem ipsum|your name|job title here|company name|tbd|insert /i.test(text)
        ? "Placeholder text was found in the pasted content."
        : "Nothing that looks like template filler.",
    },
  ];

  let earned = 0;
  let total = 0;
  for (const check of checks) {
    total += check.weight;
    earned += check.status === "pass" ? check.weight : check.status === "warn" ? check.weight * 0.55 : 0;
  }
  const score = total ? clamp(Math.round((earned / total) * 100)) : 0;

  return {
    score,
    band: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 55 ? "fair" : "needs work",
    generatedAt: new Date().toISOString(),
    disclaimer:
      "This score is Resume Forge's own heuristic, computed in your browser. It is not a score from any employer's applicant tracking system.",
    checks,
    sections: [],
    keywords,
    bulletIssues: issues,
    strengths: [],
    recommendations: checks.filter((c) => c.status !== "pass" && c.fix).map((c) => c.fix as string),
    stats: {
      words: tokens.length,
      bullets: bulletLines.length,
      quantifiedBullets: bulletLines.filter(hasQuantification).length,
      avgBulletWords: bulletLines.length ? Math.round(bulletLines.reduce((sum, b) => sum + tokenize(b).length, 0) / bulletLines.length) : 0,
      estimatedPages: Math.max(1, Math.ceil(tokens.length / 520)),
      template: "Pasted text",
      atsTemplateScore: 0,
    },
  };
};
