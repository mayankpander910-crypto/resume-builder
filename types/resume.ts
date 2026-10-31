/**
 * Core resume data model.
 *
 * Design rules that the rest of the app depends on:
 *  - Content is stored once and is template-independent. Switching a template
 *    only replaces `theme` + `layout` metadata, never content.
 *  - A section carries its own payload (`kind` + `data`) so sections can be
 *    duplicated, reordered across columns and hidden without touching content
 *    that lives somewhere else.
 *  - `column` is the single source of truth for placement; global array order is
 *    the single source of truth for ordering. Rendering a column is just a
 *    filter + map, which keeps drag & drop deterministic.
 */

export type SectionKind =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "volunteer"
  | "publications"
  | "interests"
  | "references"
  | "custom";

/* ------------------------------------------------------------------ content */

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface Basics {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  links: LinkItem[];
  /** Optional data-URL avatar. Never uploaded anywhere. */
  photo?: string;
  photoVisible: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  /** Short paragraph, optional. */
  description: string;
  bullets: string[];
  tech: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  score: string;
  details: string[];
}

export interface SkillGroup {
  id: string;
  name: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  url: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: string[];
  tech: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  venue: string;
  date: string;
  url: string;
  authors: string;
}

export interface CustomItem {
  id: string;
  heading: string;
  subheading: string;
  date: string;
  bullets: string[];
}

/* ------------------------------------------------------------------ sections */

export interface SectionBase {
  id: string;
  title: string;
  /** 0 = primary column, 1 = secondary, 2 = tertiary */
  column: 0 | 1 | 2;
  visible: boolean;
  hideTitle: boolean;
  /** Optional per-section override of the theme heading style. */
  compact?: boolean;
}

export type ResumeSection =
  | (SectionBase & { kind: "summary"; data: { text: string } })
  | (SectionBase & { kind: "experience"; data: { items: ExperienceItem[] } })
  | (SectionBase & { kind: "education"; data: { items: EducationItem[] } })
  | (SectionBase & { kind: "skills"; data: { groups: SkillGroup[]; display: "list" | "inline" | "chips" | "bars" } })
  | (SectionBase & { kind: "projects"; data: { items: ProjectItem[] } })
  | (SectionBase & { kind: "certifications"; data: { items: CertificationItem[] } })
  | (SectionBase & { kind: "achievements"; data: { items: AchievementItem[] } })
  | (SectionBase & { kind: "languages"; data: { items: LanguageItem[]; display: "list" | "inline" | "dots" } })
  | (SectionBase & { kind: "volunteer"; data: { items: ExperienceItem[] } })
  | (SectionBase & { kind: "publications"; data: { items: PublicationItem[] } })
  | (SectionBase & { kind: "interests"; data: { items: string[] } })
  | (SectionBase & { kind: "references"; data: { items: { id: string; name: string; role: string; contact: string }[] } })
  | (SectionBase & { kind: "custom"; data: { items: CustomItem[] } });

export type SectionData = ResumeSection["data"];

/* --------------------------------------------------------------------- theme */

export type FontKey =
  | "sans"
  | "geometric"
  | "serif"
  | "garamond"
  | "mono"
  | "condensed"
  | "grotesk"
  | "slab";

export type HeadingStyle = "plain" | "rule" | "bar" | "boxed" | "stacked" | "sidebar";
export type HeadingCase = "none" | "upper" | "small-caps" | "title";
export type DividerStyle = "none" | "thin" | "double" | "accent" | "dotted";
export type Density = "compact" | "normal" | "relaxed";

export interface ThemeConfig {
  fontFamily: FontKey;
  headingFontFamily: FontKey;
  fontScale: number; // multiplier on base 10pt
  headingSize: number; // pt
  nameSize: number; // pt
  lineHeight: number;
  sectionSpacing: number; // pt
  textColor: string;
  accentColor: string;
  mutedColor: string;
  headingStyle: HeadingStyle;
  headingCase: HeadingCase;
  bulletStyle: "disc" | "dash" | "square" | "none";
  divider: DividerStyle;
  headerAlign: "left" | "center";
  density: Density;
  /** Colour used for full-width header bands / sidebars. */
  bandColor: string;
  bandTextColor: string;
  showIcons: boolean;
}

export interface PageSettings {
  size: "a4" | "letter";
  marginTop: number; // mm
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showPageNumbers: boolean;
}

export interface LayoutConfig {
  /** Number of columns used by the template × user configuration. */
  columns: 1 | 2 | 3;
  /** Width of the secondary column, in percent of the content area. */
  sidebarWidth: number;
  sidebarPosition: "left" | "right";
  /** Where the running header (name/contact) lives. */
  headerLayout: "stacked" | "split" | "band" | "monogram" | "compact";
  /** `false` when the template must stay single column. */
  allowColumns: boolean;
}

export interface ResumeMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  templateId: string;
}

export interface ResumeDocument {
  meta: ResumeMeta;
  basics: Basics;
  sections: ResumeSection[];
  theme: ThemeConfig;
  page: PageSettings;
  layout: LayoutConfig;
}

/* ------------------------------------------------------------------ helpers */

export const SECTION_KIND_LABEL: Record<SectionKind, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  volunteer: "Volunteer Experience",
  publications: "Publications",
  interests: "Interests",
  references: "References",
  custom: "Custom Section",
};

export const COLUMN_INDEXES = [0, 1, 2] as const;
export type ColumnIndex = 0 | 1 | 2;
