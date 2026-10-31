/**
 * Prompt builders.
 *
 * Ground rules encoded in every prompt:
 *  - never invent employers, titles, dates, metrics, certifications or skills;
 *  - prefer omission over invention; report missing facts explicitly;
 *  - return JSON only, matching the requested shape exactly;
 *  - keep the writer's voice and facts; improve the presentation only.
 */

const COMMON_RULES = `NON-NEGOTIABLE RULES
1. Never invent facts. Do not create employers, job titles, dates, degrees, institutions, certifications, awards, technologies, metrics or percentages that are not present in the input.
2. Do not upgrade seniority or scope. If someone says "intern", keep "Intern".
3. If a fact needed for a good resume is missing, leave the field empty and list what is missing. Never guess.
4. Never add skills the candidate did not mention. You may group and order them.
5. Use plain, specific, professional English. No clichés ("results-driven", "passionate", "dynamic professional"), no emoji, no first person pronouns.
6. Bullets should start with a strong verb and describe what was done and, only where the input gives one, the measured outcome. Do not fabricate a metric to fill a gap.
7. Keep dates exactly as provided (e.g. "Mar 2022", "2021").
8. Respond with a single JSON object. No markdown fences, no commentary.`;

export const SYSTEM_RESUME_WRITER = `You are a senior resume editor who has reviewed thousands of applications for engineering, business, design and academic roles. You write tight, factual, scannable resumes. You are strict about accuracy: you would rather leave a section thin than embellish it.

${COMMON_RULES}`;

export const SYSTEM_REVIEWER = `You are an experienced technical recruiter reviewing a resume. You are direct and specific: every criticism names the exact text and offers a concrete replacement that uses only facts already present.

${COMMON_RULES}`;

/* ------------------------------------------------------------- generation */

export interface GenerateInput {
  targetRole?: string;
  experienceLevel?: string;
  basics?: Record<string, unknown>;
  facts: string;
  rawText?: string;
  mode: "full" | "raw-text";
}

export const buildGeneratePrompt = (input: GenerateInput): { system: string; user: string } => {
  const shape = `{
  "headline": "short professional headline, max 9 words, no fabrication",
  "summary": "3-4 sentence professional summary using only supplied facts",
  "experience": [{ "role": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": ["..."] }],
  "education": [{ "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "", "details": ["optional coursework or honours"] }],
  "skills": [{ "name": "group name", "items": ["only skills mentioned"] }],
  "projects": [{ "name": "", "role": "", "description": "", "bullets": ["..."], "tech": ["..."] }],
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "achievements": [{ "title": "", "issuer": "", "date": "", "description": "" }],
  "languages": [{ "name": "", "proficiency": "" }],
  "missingInformation": ["facts that would materially improve the resume"],
  "followUpQuestions": ["specific questions to ask the candidate"]
}`;

  const modeLine =
    input.mode === "raw-text"
      ? `The candidate has written an unstructured description of their background. Convert it into sections. Keep every fact; drop filler. Do not add anything that is not stated or unambiguously implied by the text.`
      : `The candidate provided structured facts. Turn them into a complete resume.`;

  const user = [
    `TASK: Write resume content as JSON.`,
    modeLine,
    input.targetRole ? `TARGET ROLE: ${input.targetRole}` : "",
    input.experienceLevel ? `EXPERIENCE LEVEL: ${input.experienceLevel}` : "",
    input.basics && Object.keys(input.basics).length
      ? `CONTACT DETAILS (use verbatim, do not alter):\n${JSON.stringify(input.basics)}`
      : "CONTACT DETAILS: none supplied — omit them.",
    input.rawText ? `CANDIDATE'S OWN WORDS:\n"""${input.rawText}"""` : "",
    input.facts ? `VERIFIED FACTS:\n"""${input.facts}"""` : "",
    `Return exactly this JSON shape (empty arrays where there is nothing factual to say):\n${shape}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system: SYSTEM_RESUME_WRITER, user };
};

/* ------------------------------------------------------------ improvement */

export interface ImproveInput {
  action: string;
  target: string;
  content: string;
  context?: string;
  jobDescription?: string;
}

const ACTION_BRIEF: Record<string, string> = {
  improve: "Improve clarity, specificity and rhythm without changing facts.",
  rewrite: "Rewrite for a stronger, more professional register. Same facts, sharper wording.",
  bullets: "Convert this into 3-5 achievement-style bullet points. One idea per bullet. No invented numbers.",
  concise: "Cut the length by roughly 40% while keeping every fact. Remove hedging and filler.",
  grammar: "Fix grammar, spelling, punctuation and tense consistency only. Do not restructure.",
  tone: "Adjust tone for a professional application. Avoid jargon and clichés.",
  keywords: "Improve alignment with the job description using words the candidate has already earned. Never invent tools or experience.",
};

export const buildImprovePrompt = (input: ImproveInput): { system: string; user: string } => {
  const brief = ACTION_BRIEF[input.action] ?? ACTION_BRIEF.improve;
  const bulletMode = input.action === "bullets";
  const shape = bulletMode
    ? `{ "bullets": ["..."], "notes": ["anything the user must verify"] }`
    : `{ "improved": "rewritten text", "changes": ["what you changed and why, one line each"], "warnings": ["claims that look unsupported"], "needsMoreInfo": ["facts that would make this stronger"] }`;

  const user = [
    `TASK: ${brief}`,
    `SECTION TYPE: ${input.target}`,
    input.context ? `RESUME CONTEXT (for consistency only — do not copy claims from it into this section):\n"""${input.context}"""` : "",
    input.jobDescription ? `TARGET JOB DESCRIPTION (use only for vocabulary, not for new claims):\n"""${input.jobDescription}"""` : "",
    `TEXT TO IMPROVE:\n"""${input.content}"""`,
    `Return exactly: ${shape}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system: SYSTEM_RESUME_WRITER, user };
};

/* ----------------------------------------------------------------- review */

export const buildReviewPrompt = (input: { resumeText: string; jobDescription?: string }): { system: string; user: string } => {
  const shape = `{
  "overallScore": 0-100,
  "summary": "2-3 sentences of overall assessment",
  "strengths": ["..."],
  "issues": [{ "section": "", "severity": "high|medium|low", "problem": "", "suggestion": "", "replacement": "optional rewritten text grounded in existing facts" }],
  "missingSections": ["..."],
  "questions": ["what to ask the candidate"]
}`;
  const user = [
    `TASK: Review this resume as a hiring manager would, then as a parser would.`,
    input.jobDescription ? `ROLE CONTEXT:\n"""${input.jobDescription}"""` : "ROLE CONTEXT: not provided — assess general effectiveness.",
    `RESUME (plain text, as extracted):\n"""${input.resumeText}"""`,
    `Return exactly: ${shape}`,
  ].join("\n\n");
  return { system: SYSTEM_REVIEWER, user };
};

/* ----------------------------------------------------------------- tailor */

export const buildTailorPrompt = (input: { resumeText: string; jobDescription: string }): { system: string; user: string } => {
  const shape = `{
  "matchScore": 0-100,
  "matchedKeywords": ["..."],
  "missingKeywords": ["..."],
  "suggestions": [{ "section": "", "current": "existing text", "suggested": "rewritten text using only existing facts", "rationale": "" }],
  "summaryRewrite": "optional rewritten summary, factual only",
  "warnings": ["..."],
}`;
  const user = [
    `TASK: Compare the resume to the job description. Identify the vocabulary that matters, then rewrite existing content to use it — without keyword stuffing and without adding experience the candidate does not have.`,
    `JOB DESCRIPTION:\n"""${input.jobDescription}"""`,
    `RESUME:\n"""${input.resumeText}"""`,
    `Return exactly: ${shape}`,
  ].join("\n\n");
  return { system: SYSTEM_RESUME_WRITER, user };
};

/* ------------------------------------------------------------ cover note */

export const buildCoverNotePrompt = (input: { resumeText: string; jobDescription: string; company?: string }): { system: string; user: string } => {
  const user = [
    `TASK: Write a 120-160 word cover note in the candidate's voice, grounded strictly in the resume.`,
    input.company ? `COMPANY: ${input.company}` : "",
    `JOB DESCRIPTION:\n"""${input.jobDescription}"""`,
    `RESUME:\n"""${input.resumeText}"""`,
    `Return: { "note": "..." }`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { system: SYSTEM_RESUME_WRITER, user };
};
