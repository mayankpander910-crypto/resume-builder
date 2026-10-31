import type { ResumeDocument } from "@/types/resume";
import { resumeDocumentSchema } from "@/lib/resume/schema/resume";

export interface ValidationIssue {
  level: "error" | "warning";
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  /** Fatal issues mean the payload cannot be loaded at all. */
  fatal: boolean;
}

/**
 * Validates a document that arrives from storage or from an imported file.
 *
 * The goal is a usable document rather than a perfect one: structural problems
 * are fatal, while questionable content (empty fields, duplicate ids) is
 * reported as warnings so the editor can still open and the user can fix it in
 * place.
 */
export const validateDocument = (input: unknown): ValidationResult => {
  const parsed = resumeDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      fatal: true,
      issues: parsed.error.issues.slice(0, 12).map((issue) => ({
        level: "error" as const,
        path: issue.path.join(".") || "document",
        message: issue.message,
      })),
    };
  }

  const doc = parsed.data as ResumeDocument;
  const issues: ValidationIssue[] = [];

  if (!doc.basics.fullName.trim()) issues.push({ level: "warning", path: "basics.fullName", message: "No name yet." });
  if (!doc.basics.email.trim()) {
    issues.push({ level: "warning", path: "basics.email", message: "No email address yet — most parsers need one." });
  }
  if (doc.sections.length === 0) {
    issues.push({ level: "warning", path: "sections", message: "The document has no sections." });
  } else if (!doc.sections.some((section) => section.visible)) {
    issues.push({ level: "warning", path: "sections", message: "Every section is hidden, so the page renders empty." });
  }

  const ids = new Set<string>();
  for (const section of doc.sections) {
    if (ids.has(section.id)) {
      issues.push({ level: "warning", path: `sections.${section.id}`, message: "Duplicate section id — one of them may not update." });
    }
    ids.add(section.id);
  }

  return { ok: true, fatal: false, issues };
};

/** Reads a payload written by the app (wrapped) or by an older bare export. */
export const parseStoredDocument = (raw: string): { doc: ResumeDocument | null; issues: ValidationIssue[] } => {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { doc: null, issues: [{ level: "error", path: "storage", message: "Saved data is not valid JSON." }] };
  }
  const candidate = (payload as { doc?: unknown })?.doc ?? payload;
  const result = validateDocument(candidate);
  if (!result.ok) return { doc: null, issues: result.issues };
  return { doc: resumeDocumentSchema.parse(candidate) as ResumeDocument, issues: result.issues };
};
