import type { GeneratedResume } from "@/lib/ai/schemas";
import type { ResumeSection } from "@/types/resume";
import { createId } from "@/lib/resume/schema/factory";

/**
 * Turns a validated AI payload into real sections. Nothing is written to the
 * document until the user accepts it in the review step — this function only
 * builds the candidate content.
 */
export const generatedToSections = (generated: GeneratedResume, options: { includeProjects?: boolean } = {}): ResumeSection[] => {
  const sections: ResumeSection[] = [];

  if (generated.summary.trim()) {
    sections.push({
      id: createId("summary"),
      kind: "summary",
      title: "Professional Summary",
      column: 0,
      visible: true,
      hideTitle: false,
      data: { text: generated.summary.trim() },
    });
  }

  if (generated.experience.length) {
    sections.push({
      id: createId("experience"),
      kind: "experience",
      title: "Work Experience",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: generated.experience
          .filter((item) => item.role || item.company)
          .map((item) => ({
            id: createId("exp"),
            role: item.role,
            company: item.company,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            current: /present|current|now/i.test(item.endDate),
            description: "",
            bullets: item.bullets.filter((b) => b.trim()),
            tech: [],
          })),
      },
    });
  }

  if (options.includeProjects !== false && generated.projects.length) {
    sections.push({
      id: createId("projects"),
      kind: "projects",
      title: "Projects",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: generated.projects
          .filter((item) => item.name)
          .map((item) => ({
            id: createId("prj"),
            name: item.name,
            role: item.role,
            url: "",
            startDate: "",
            endDate: "",
            description: item.description,
            bullets: item.bullets.filter((b) => b.trim()),
            tech: item.tech,
          })),
      },
    });
  }

  if (generated.education.length) {
    sections.push({
      id: createId("education"),
      kind: "education",
      title: "Education",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: generated.education
          .filter((item) => item.degree || item.institution)
          .map((item) => ({
            id: createId("edu"),
            degree: item.degree,
            institution: item.institution,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            score: "",
            details: item.details.filter((d) => d.trim()),
          })),
      },
    });
  }

  const skillGroups = generated.skills.filter((group) => group.items.length > 0);
  if (skillGroups.length) {
    sections.push({
      id: createId("skills"),
      kind: "skills",
      title: "Skills",
      column: 0,
      visible: true,
      hideTitle: false,
      data: { groups: skillGroups.map((group) => ({ id: createId("grp"), name: group.name || "Skills", items: group.items })), display: "inline" },
    });
  }

  if (generated.certifications.length) {
    sections.push({
      id: createId("certifications"),
      kind: "certifications",
      title: "Certifications",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: generated.certifications
          .filter((item) => item.name)
          .map((item) => ({ id: createId("cert"), name: item.name, issuer: item.issuer, date: item.date, url: "" })),
      },
    });
  }

  if (generated.achievements.length) {
    sections.push({
      id: createId("achievements"),
      kind: "achievements",
      title: "Achievements",
      column: 0,
      visible: true,
      hideTitle: false,
      data: {
        items: generated.achievements
          .filter((item) => item.title)
          .map((item) => ({ id: createId("ach"), title: item.title, issuer: item.issuer, date: item.date, description: item.description })),
      },
    });
  }

  if (generated.languages.length) {
    sections.push({
      id: createId("languages"),
      kind: "languages",
      title: "Languages",
      column: 0,
      visible: true,
      hideTitle: false,
      data: { items: generated.languages.filter((l) => l.name).map((l) => ({ id: createId("lang"), name: l.name, proficiency: l.proficiency })), display: "inline" },
    });
  }

  return sections;
};
