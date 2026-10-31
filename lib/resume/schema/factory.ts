import type {
  Basics,
  LayoutConfig,
  PageSettings,
  ResumeDocument,
  ResumeSection,
  SectionKind,
  ThemeConfig,
} from "@/types/resume";
import { SECTION_KIND_LABEL } from "@/types/resume";

export const createId = (prefix = "id"): string => {
  const g = globalThis as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return `${prefix}_${g.crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
};

export const emptyBasics = (): Basics => ({
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
  links: [],
  photoVisible: false,
});

export const defaultTheme = (): ThemeConfig => ({
  fontFamily: "grotesk",
  headingFontFamily: "grotesk",
  fontScale: 1,
  headingSize: 11,
  nameSize: 26,
  lineHeight: 1.45,
  sectionSpacing: 14,
  textColor: "#1f2933",
  accentColor: "#2f5d50",
  mutedColor: "#6b7280",
  headingStyle: "rule",
  headingCase: "upper",
  bulletStyle: "disc",
  divider: "thin",
  headerAlign: "left",
  density: "normal",
  bandColor: "#2f5d50",
  bandTextColor: "#ffffff",
  showIcons: true,
});

export const defaultPage = (): PageSettings => ({
  size: "a4",
  marginTop: 16,
  marginRight: 16,
  marginBottom: 16,
  marginLeft: 16,
  showPageNumbers: false,
});

export const defaultLayout = (): LayoutConfig => ({
  columns: 1,
  sidebarWidth: 32,
  sidebarPosition: "right",
  headerLayout: "stacked",
  allowColumns: true,
});

export const emptySectionData = (kind: SectionKind): ResumeSection["data"] => {
  switch (kind) {
    case "summary":
      return { text: "" };
    case "experience":
    case "volunteer":
      return {
        items: [
          {
            id: createId("exp"),
            role: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
            bullets: [""],
            tech: [],
          },
        ],
      };
    case "education":
      return {
        items: [
          {
            id: createId("edu"),
            degree: "",
            institution: "",
            location: "",
            startDate: "",
            endDate: "",
            score: "",
            details: [],
          },
        ],
      };
    case "skills":
      return { groups: [{ id: createId("skill"), name: "Core skills", items: [] }], display: "inline" };
    case "projects":
      return {
        items: [
          {
            id: createId("prj"),
            name: "",
            role: "",
            url: "",
            startDate: "",
            endDate: "",
            description: "",
            bullets: [""],
            tech: [],
          },
        ],
      };
    case "certifications":
      return { items: [{ id: createId("cert"), name: "", issuer: "", date: "", url: "" }] };
    case "achievements":
      return { items: [{ id: createId("ach"), title: "", issuer: "", date: "", description: "" }] };
    case "languages":
      return { items: [{ id: createId("lang"), name: "", proficiency: "" }], display: "inline" };
    case "publications":
      return { items: [{ id: createId("pub"), title: "", venue: "", date: "", url: "", authors: "" }] };
    case "interests":
      return { items: [] };
    case "references":
      return { items: [{ id: createId("ref"), name: "", role: "", contact: "" }] };
    case "custom":
      return { items: [{ id: createId("cus"), heading: "", subheading: "", date: "", bullets: [""] }] };
  }
};

export const createSection = (kind: SectionKind, column: 0 | 1 | 2 = 0, title?: string): ResumeSection =>
  ({
    id: createId(kind),
    kind,
    title: title ?? SECTION_KIND_LABEL[kind],
    column,
    visible: true,
    hideTitle: false,
    data: emptySectionData(kind),
  }) as ResumeSection;

export const createEmptyResume = (name = "Untitled resume"): ResumeDocument => {
  const now = new Date().toISOString();
  return {
    meta: { id: createId("resume"), name, createdAt: now, updatedAt: now, templateId: "meridian" },
    basics: emptyBasics(),
    sections: [
      createSection("summary"),
      createSection("experience"),
      createSection("education"),
      createSection("skills"),
    ],
    theme: defaultTheme(),
    page: defaultPage(),
    layout: defaultLayout(),
  };
};

/** True when the resume has no meaningful content yet. */
export const isResumeEmpty = (doc: ResumeDocument): boolean => {
  const b = doc.basics;
  const hasHeader = Boolean(b.fullName || b.email || b.headline);
  const hasBody = doc.sections.some((s) => sectionHasContent(s));
  return !hasHeader && !hasBody;
};

export const sectionHasContent = (section: ResumeSection): boolean => {
  switch (section.kind) {
    case "summary":
      return section.data.text.trim().length > 0;
    case "skills":
      return section.data.groups.some((g) => g.items.length > 0);
    case "languages":
      return section.data.items.some((i) => i.name.trim().length > 0);
    case "interests":
      return section.data.items.some((i) => i.trim().length > 0);
    case "achievements":
      return section.data.items.some((i) => i.title.trim().length > 0 || i.description.trim().length > 0);
    case "certifications":
      return section.data.items.some((i) => i.name.trim().length > 0);
    case "references":
      return section.data.items.some((i) => i.name.trim().length > 0);
    case "publications":
      return section.data.items.some((i) => i.title.trim().length > 0);
    case "education":
      return section.data.items.some((i) => i.degree.trim().length > 0 || i.institution.trim().length > 0);
    case "experience":
    case "volunteer":
      return section.data.items.some((i) => i.role.trim().length > 0 || i.company.trim().length > 0);
    case "projects":
      return section.data.items.some((i) => i.name.trim().length > 0);
    case "custom":
      return section.data.items.some((i) => i.heading.trim().length > 0);
  }
};
