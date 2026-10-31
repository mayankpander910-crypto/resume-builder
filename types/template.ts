import type {
  Density,
  DividerStyle,
  FontKey,
  HeadingCase,
  HeadingStyle,
  LayoutConfig,
  PageSettings,
  SectionKind,
  ThemeConfig,
} from "@/types/resume";

export type TemplateCategory =
  | "ats"
  | "tech"
  | "student"
  | "corporate"
  | "creative"
  | "international"
  | "layout";

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; blurb: string }[] = [
  { id: "ats", label: "ATS-friendly", blurb: "Single column, standard headings, parser-safe typography." },
  { id: "tech", label: "Technology & Engineering", blurb: "Built for engineering, data, security and platform roles." },
  { id: "student", label: "Students & Freshers", blurb: "Education, projects and coursework forward." },
  { id: "corporate", label: "Corporate & Business", blurb: "Analyst, product, marketing, finance and leadership." },
  { id: "creative", label: "Creative", blurb: "Design, editorial and portfolio-led layouts." },
  { id: "international", label: "International", blurb: "US, UK, EU, Canadian, Australian and academic conventions." },
  { id: "layout", label: "Layout Studies", blurb: "Sidebar, timeline, multi-column and typographic studies." },
];

export type ExperienceLevel = "student" | "entry" | "mid" | "senior" | "executive" | "any";
export type TemplateStyle = "minimal" | "modern" | "creative" | "corporate" | "academic";

/**
 * A structural archetype is a layout primitive in the renderer: header treatment,
 * section-heading treatment, column rhythm and optional page chrome.
 * Templates combine one archetype with their own theme tokens, ordering and columns.
 */
export type Archetype =
  | "classic"
  | "modern"
  | "sidebar"
  | "equal-split"
  | "timeline"
  | "editorial"
  | "compact"
  | "band"
  | "grid"
  | "monogram"
  | "academic"
  | "portfolio"
  | "executive"
  | "minimal"
  | "infographic"
  | "columnar";

export interface ArchetypeDefinition {
  id: Archetype;
  label: string;
  /** Full-bleed accent band behind the header. */
  bandHeader: boolean;
  /** Tint the secondary column from page edge to edge. */
  tintSidebar: boolean;
  /** Draw a vertical hairline between columns. */
  columnRule: boolean;
  /** Timeline rail with dots for dated items. */
  timeline: boolean;
  /** Show a monogram tile next to the name. */
  monogram: boolean;
  /** Force a section-heading default when the template does not set one. */
  headingStyle: HeadingStyle;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  tagline: string;
  category: TemplateCategory;
  archetype: Archetype;
  industry: string;
  level: ExperienceLevel;
  style: TemplateStyle;
  /** Internal heuristic, documented on the template page. */
  atsScore: number;
  atsLabel: string;
  columns: 1 | 2 | 3;
  pageSize: PageSettings["size"];
  theme: ThemeConfig;
  layout: LayoutConfig;
  /** Preferred ordering of section kinds. Unknown kinds are appended in document order. */
  sectionOrder: SectionKind[];
  /** Kinds that belong in the secondary column when columns > 1. */
  sidebarKinds: SectionKind[];
  tags: string[];
}

export interface TemplateThemeInput {
  accent: string;
  band?: string;
  bandText?: string;
  font: FontKey;
  headingFont?: FontKey;
  headingStyle?: HeadingStyle;
  headingCase?: HeadingCase;
  divider?: DividerStyle;
  density?: Density;
  headerAlign?: "left" | "center";
  fontScale?: number;
  headingSize?: number;
  nameSize?: number;
  lineHeight?: number;
  sectionSpacing?: number;
  muted?: string;
  bulletStyle?: ThemeConfig["bulletStyle"];
  showIcons?: boolean;
}
