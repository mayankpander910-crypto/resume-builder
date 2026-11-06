
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

/* ---------------------------------------------------------- canvas positioning */

/**
 * A section's position on the resume canvas.
 *
 * Coordinates are expressed in millimetres relative to the printable
 * content area of the specified page.
 *
 * These coordinates are independent of the editor's zoom level.
 */
export interface CanvasPosition {
  /** Zero-based page index. */
  page: number;

  /** Horizontal offset from the printable content area's left edge (mm). */
  x: number;

  /** Vertical offset from the printable content area's top edge (mm). */
  y: number;

  /** Optional section width in millimetres. */
  width?: number;

  /** Optional section height in millimetres. */
  height?: number;

  /** Stacking order when positioned sections overlap. */
  zIndex?: number;

  /** Prevent dragging and resizing when true. */
  locked?: boolean;
}

export interface SectionTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: "left" | "center" | "right" | "justify";
  fontSize?: number;
  color?: string;
}

/**
 * "flow" uses the existing pagination and column layout.
 * "free" enables explicitly positioned sections.
 */
export type PositioningMode = "flow" | "free";

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

  /** Optional editor formatting; omitted by existing documents. */
  textStyle?: SectionTextStyle;

  /**
   * Optional position on the canvas.
   *
   * Undefined means the section has no explicit canvas position.
   * Existing documents remain valid without this property.
   */
  position?: CanvasPosition;
}

export type ResumeSection =
  | (SectionBase & {
      kind: "summary";
      data: { text: string };
    })
  | (SectionBase & {
      kind: "experience";
      data: { items: ExperienceItem[] };
    })
  | (SectionBase & {
      kind: "education";
      data: { items: EducationItem[] };
    })
  | (SectionBase & {
      kind: "skills";
      data: {
        groups: SkillGroup[];
        display: "list" | "inline" | "chips" | "bars";
      };
    })
  | (SectionBase & {
      kind: "projects";
      data: { items: ProjectItem[] };
    })
  | (SectionBase & {
      kind: "certifications";
      data: { items: CertificationItem[] };
    })
  | (SectionBase & {
      kind: "achievements";
      data: { items: AchievementItem[] };
    })
  | (SectionBase & {
      kind: "languages";
      data: {
        items: LanguageItem[];
        display: "list" | "inline" | "dots";
      };
    })
  | (SectionBase & {
      kind: "volunteer";
      data: { items: ExperienceItem[] };
    })
  | (SectionBase & {
      kind: "publications";
      data: { items: PublicationItem[] };
    })
  | (SectionBase & {
      kind: "interests";
      data: { items: string[] };
    })
  | (SectionBase & {
      kind: "references";
      data: {
        items: {
          id: string;
          name: string;
          role: string;
          contact: string;
        }[];
      };
    })
  | (SectionBase & {
      kind: "custom";
      data: { items: CustomItem[] };
    });

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

export type HeadingStyle =
  | "plain"
  | "rule"
  | "bar"
  | "boxed"
  | "stacked"
  | "sidebar";

export type HeadingCase = "none" | "upper" | "small-caps" | "title";

export type DividerStyle =
  | "none"
  | "thin"
  | "double"
  | "accent"
  | "dotted";

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

/* ---------------------------------------------------------------------- page */

export interface PageSettings {
  size: "a4" | "letter";

  marginTop: number; // mm
  marginRight: number;
  marginBottom: number;
  marginLeft: number;

  showPageNumbers: boolean;
}

/* -------------------------------------------------------------------- layout */

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

  /**
   * Controls how sections are positioned.
   *
   * Undefined is treated as "flow" to preserve existing documents.
   */
  positioningMode?: PositioningMode;

  /**
   * Optional grid snapping interval in millimetres.
   * Used by the free-position canvas editor.
   */
  snapToGrid?: number;

  /**
   * Whether alignment guides should be displayed in the editor.
   */
  showAlignmentGuides?: boolean;
}

/* ---------------------------------------------------------------------- meta */

export interface ResumeMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  templateId: string;
}

/* ------------------------------------------------------------------ document */

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

/* ------------------------------------------------------------- canvas helpers */

/**
 * Returns the effective positioning mode.
 * Older documents without this property use flow layout.
 */
export function getPositioningMode(
  layout: LayoutConfig
): PositioningMode {
  return layout.positioningMode ?? "flow";
}

/**
 * Returns true when a section has an explicit canvas position.
 */
export function hasCanvasPosition(
  section: ResumeSection
): boolean {
  return section.position !== undefined;
}

/**
 * Returns whether a section can be moved on the free-position canvas.
 */
export function isSectionMovable(
  section: ResumeSection
): boolean {
  return section.position?.locked !== true;
}

/**
 * Converts a millimetre measurement into CSS pixels.
 * CSS uses 96 pixels per inch and 25.4 millimetres per inch.
 */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}

/**
 * Converts CSS pixels into millimetres.
 */
export function pxToMm(px: number): number {
  return (px * 25.4) / 96;
}

/**
 * Snaps a millimetre coordinate to the nearest grid increment.
 *
 * A grid size of zero disables snapping.
 */
export function snapToGrid(
  value: number,
  gridSize: number
): number {
  if (!Number.isFinite(value)) return 0;

  if (!Number.isFinite(gridSize) || gridSize <= 0) {
    return value;
  }

  return Math.round(value / gridSize) * gridSize;
}
