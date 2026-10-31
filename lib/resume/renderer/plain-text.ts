import type { ResumeDocument, ResumeSection } from "@/types/resume";
import { formatRange, joinNonEmpty } from "@/lib/resume/renderer/format";

/**
 * Flattens a resume into the plain text an ATS would extract. Used by the ATS
 * analyser, the review prompt and (optionally) AI requests — never by
 * analytics, and never logged on the server.
 */
export const resumeToPlainText = (doc: ResumeDocument, options: { includeHidden?: boolean } = {}): string => {
  const lines: string[] = [];
  const b = doc.basics;
  lines.push(b.fullName || "Untitled candidate");
  if (b.headline) lines.push(b.headline);
  const contact = joinNonEmpty([b.email, b.phone, b.location, b.website, b.linkedin, b.github], " | ");
  if (contact) lines.push(contact);

  for (const section of doc.sections) {
    if (!section.visible && !options.includeHidden) continue;
    const body = sectionToText(section);
    if (!body.trim()) continue;
    lines.push("");
    lines.push(section.title.toUpperCase());
    lines.push(body);
  }
  return lines.join("\n");
};

export const sectionToText = (section: ResumeSection): string => {
  switch (section.kind) {
    case "summary":
      return section.data.text;
    case "skills":
      return section.data.groups.map((g) => `${g.name}: ${g.items.join(", ")}`).join("\n");
    case "languages":
      return section.data.items.map((i) => joinNonEmpty([i.name, i.proficiency], " — ")).join("\n");
    case "interests":
      return section.data.items.join(", ");
    case "experience":
    case "volunteer":
      return section.data.items
        .map((item) =>
          [
            `${item.role}${item.company ? ` — ${item.company}` : ""}${item.location ? `, ${item.location}` : ""}`,
            formatRange(item.startDate, item.endDate, item.current),
            item.description,
            ...item.bullets.filter(Boolean).map((bullet) => `• ${bullet}`),
            item.tech.length ? `Technologies: ${item.tech.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n");
    case "education":
      return section.data.items
        .map((item) =>
          [
            `${item.degree}${item.institution ? ` — ${item.institution}` : ""}`,
            joinNonEmpty([item.location, item.score], " · "),
            formatRange(item.startDate, item.endDate),
            ...item.details.filter(Boolean).map((detail) => `• ${detail}`),
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n");
    case "projects":
      return section.data.items
        .map((item) =>
          [
            `${item.name}${item.role ? ` — ${item.role}` : ""}`,
            item.url,
            item.description,
            ...item.bullets.filter(Boolean).map((bullet) => `• ${bullet}`),
            item.tech.length ? `Technologies: ${item.tech.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n");
    case "certifications":
      return section.data.items.map((item) => joinNonEmpty([item.name, item.issuer, item.date], " · ")).join("\n");
    case "achievements":
      return section.data.items.map((item) => joinNonEmpty([item.title, item.issuer, item.date, item.description], " · ")).join("\n");
    case "publications":
      return section.data.items.map((item) => joinNonEmpty([item.authors, item.title, item.venue, item.date], ". ")).join("\n\n");
    case "references":
      return section.data.items.map((item) => joinNonEmpty([item.name, item.role, item.contact], " · ")).join("\n");
    case "custom":
      return section.data.items
        .map((item) => [joinNonEmpty([item.heading, item.subheading, item.date], " · "), ...item.bullets.filter(Boolean).map((b) => `• ${b}`)].join("\n"))
        .join("\n\n");
    default:
      return "";
  }
};

/** Everything a reviewer needs, trimmed so prompts stay small. */
export const resumeToPromptText = (doc: ResumeDocument, maxChars = 9000): string => {
  const text = resumeToPlainText(doc);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[truncated]`;
};
