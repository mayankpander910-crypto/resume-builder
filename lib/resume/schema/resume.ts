
import { z } from "zod";

/**
 * Zod schema for imported / AI-generated resume documents.
 * Every value is bounded so a hostile payload cannot blow up the renderer.
 */

const short = (max = 160) => z.string().max(max);
const text = (max = 4000) => z.string().max(max);
const isoDateish = z.string().max(40);

const id = z.string().min(1).max(64);

/* ------------------------------------------------------------------ basics */

export const linkItemSchema = z.object({
  id,
  label: short(60),
  url: short(500),
});

export const basicsSchema = z.object({
  fullName: short(120),
  headline: short(160),
  email: short(200),
  phone: short(60),
  location: short(160),
  website: short(300),
  linkedin: short(300),
  github: short(300),
  links: z.array(linkItemSchema).max(10),
  photo: z.string().max(500_000).optional(),
  photoVisible: z.boolean(),
});

/* --------------------------------------------------------------- resume items */

export const experienceItemSchema = z.object({
  id,
  role: short(160),
  company: short(160),
  location: short(120),
  startDate: short(40),
  endDate: short(40),
  current: z.boolean(),
  description: text(1200),
  bullets: z.array(text(600)).max(20),
  tech: z.array(short(40)).max(30),
});

export const educationItemSchema = z.object({
  id,
  degree: short(180),
  institution: short(180),
  location: short(120),
  startDate: short(40),
  endDate: short(40),
  score: short(60),
  details: z.array(text(400)).max(10),
});

export const skillGroupSchema = z.object({
  id,
  name: short(80),
  items: z.array(short(60)).max(40),
});

export const projectItemSchema = z.object({
  id,
  name: short(180),
  role: short(120),
  url: short(300),
  startDate: short(40),
  endDate: short(40),
  description: text(1200),
  bullets: z.array(text(600)).max(20),
  tech: z.array(short(40)).max(30),
});

export const certificationItemSchema = z.object({
  id,
  name: short(180),
  issuer: short(160),
  date: short(40),
  url: short(300),
});

export const achievementItemSchema = z.object({
  id,
  title: short(180),
  issuer: short(160),
  date: short(40),
  description: text(600),
});

export const languageItemSchema = z.object({
  id,
  name: short(60),
  proficiency: short(60),
});

export const publicationItemSchema = z.object({
  id,
  title: short(300),
  venue: short(200),
  date: short(40),
  url: short(300),
  authors: short(300),
});

export const customItemSchema = z.object({
  id,
  heading: short(180),
  subheading: short(180),
  date: short(40),
  bullets: z.array(text(600)).max(20),
});

export const referenceItemSchema = z.object({
  id,
  name: short(120),
  role: short(160),
  contact: short(200),
});

/* ---------------------------------------------------------- canvas positioning */

/**
 * Coordinates are stored in millimetres relative to the printable
 * content area's top-left corner.
 *
 * Bounds are intentionally generous to support different page sizes
 * and multi-page resumes while preventing unreasonable imported values.
 */
export const canvasPositionSchema = z.object({
  page: z.number().int().min(0).max(99),

  x: z.number().finite().min(-500).max(1000),
  y: z.number().finite().min(-500).max(2000),

  width: z.number().finite().positive().max(1000).optional(),
  height: z.number().finite().positive().max(2000).optional(),

  zIndex: z.number().int().min(-1000).max(1000).optional(),

  locked: z.boolean().optional(),
});

const sectionTextStyleSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  fontSize: z.number().finite().min(6).max(36).optional(),
  color: z.string().max(32).optional(),
});

/* ------------------------------------------------------------------ sections */

const sectionBase = {
  id,
  title: short(80),
  column: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  visible: z.boolean(),
  hideTitle: z.boolean(),
  compact: z.boolean().optional(),
  textStyle: sectionTextStyleSchema.optional(),

  /** Optional canvas position; omitted for traditional flow layout. */
  position: canvasPositionSchema.optional(),
};

export const resumeSectionSchema = z.discriminatedUnion("kind", [
  z.object({
    ...sectionBase,
    kind: z.literal("summary"),
    data: z.object({ text: text(3000) }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("experience"),
    data: z.object({
      items: z.array(experienceItemSchema).max(30),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("education"),
    data: z.object({
      items: z.array(educationItemSchema).max(15),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("skills"),
    data: z.object({
      groups: z.array(skillGroupSchema).max(12),
      display: z.enum(["list", "inline", "chips", "bars"]),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("projects"),
    data: z.object({
      items: z.array(projectItemSchema).max(20),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("certifications"),
    data: z.object({
      items: z.array(certificationItemSchema).max(20),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("achievements"),
    data: z.object({
      items: z.array(achievementItemSchema).max(20),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("languages"),
    data: z.object({
      items: z.array(languageItemSchema).max(15),
      display: z.enum(["list", "inline", "dots"]),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("volunteer"),
    data: z.object({
      items: z.array(experienceItemSchema).max(15),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("publications"),
    data: z.object({
      items: z.array(publicationItemSchema).max(40),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("interests"),
    data: z.object({
      items: z.array(short(60)).max(20),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("references"),
    data: z.object({
      items: z.array(referenceItemSchema).max(10),
    }),
  }),

  z.object({
    ...sectionBase,
    kind: z.literal("custom"),
    data: z.object({
      items: z.array(customItemSchema).max(20),
    }),
  }),
]);

/* --------------------------------------------------------------------- theme */

export const themeSchema = z.object({
  fontFamily: z.enum([
    "sans",
    "geometric",
    "serif",
    "garamond",
    "mono",
    "condensed",
    "grotesk",
    "slab",
  ]),

  headingFontFamily: z.enum([
    "sans",
    "geometric",
    "serif",
    "garamond",
    "mono",
    "condensed",
    "grotesk",
    "slab",
  ]),

  fontScale: z.number().min(0.7).max(1.6),
  headingSize: z.number().min(8).max(22),
  nameSize: z.number().min(14).max(44),
  lineHeight: z.number().min(1).max(2.2),
  sectionSpacing: z.number().min(2).max(40),

  textColor: z.string().max(30),
  accentColor: z.string().max(30),
  mutedColor: z.string().max(30),

  headingStyle: z.enum([
    "plain",
    "rule",
    "bar",
    "boxed",
    "stacked",
    "sidebar",
  ]),

  headingCase: z.enum(["none", "upper", "small-caps", "title"]),
  bulletStyle: z.enum(["disc", "dash", "square", "none"]),
  divider: z.enum(["none", "thin", "double", "accent", "dotted"]),
  headerAlign: z.enum(["left", "center"]),
  density: z.enum(["compact", "normal", "relaxed"]),

  bandColor: z.string().max(30),
  bandTextColor: z.string().max(30),

  showIcons: z.boolean(),
});

/* ---------------------------------------------------------------------- page */

export const pageSchema = z.object({
  size: z.enum(["a4", "letter"]),

  marginTop: z.number().min(6).max(35),
  marginRight: z.number().min(6).max(35),
  marginBottom: z.number().min(6).max(35),
  marginLeft: z.number().min(6).max(35),

  showPageNumbers: z.boolean(),
});

/* -------------------------------------------------------------------- layout */

export const layoutSchema = z.object({
  columns: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ]),

  sidebarWidth: z.number().min(22).max(46),

  sidebarPosition: z.enum(["left", "right"]),

  headerLayout: z.enum([
    "stacked",
    "split",
    "band",
    "monogram",
    "compact",
  ]),

  allowColumns: z.boolean(),

  /** Missing value defaults to flow mode in the application. */
  positioningMode: z.enum(["flow", "free"]).optional(),

  /** Grid interval in millimetres. Zero disables snapping. */
  snapToGrid: z.number().finite().min(0).max(50).optional(),

  /** Whether canvas alignment guides are displayed. */
  showAlignmentGuides: z.boolean().optional(),
});

/* --------------------------------------------------------------- full document */

export const resumeDocumentSchema = z.object({
  meta: z.object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(160),
    createdAt: z.string().max(40),
    updatedAt: z.string().max(40),
    templateId: z.string().max(64),
  }),

  basics: basicsSchema,

  sections: z.array(resumeSectionSchema).max(40),

  theme: themeSchema,

  page: pageSchema,

  layout: layoutSchema,
});

/* ------------------------------------------------------------- AI request schemas */

/** Payload used when a client wants a resume generated for them. */
export const generateRequestSchema = z.object({
  mode: z.enum(["full", "raw-text", "tailor", "review"]),

  targetRole: short(160).optional(),

  experienceLevel: z
    .enum([
      "student",
      "fresher",
      "junior",
      "mid",
      "senior",
      "lead",
      "executive",
    ])
    .optional(),

  rawText: text(12_000).optional(),
  jobDescription: text(12_000).optional(),

  basics: basicsSchema.partial().optional(),

  facts: text(12_000).optional(),

  consent: z.literal(true),

  /** Only these keys ever leave the browser. */
  resumeSlice: z.unknown().optional(),
});

export const improveRequestSchema = z.object({
  action: z.enum([
    "improve",
    "rewrite",
    "bullets",
    "concise",
    "grammar",
    "tone",
    "keywords",
  ]),

  target: z.enum([
    "summary",
    "experience",
    "project",
    "skills",
    "education",
    "achievement",
    "generic",
  ]),

  content: text(6000),
  context: text(4000).optional(),
  jobDescription: text(12_000).optional(),

  consent: z.literal(true),
});

export const reviewRequestSchema = z.object({
  resume: resumeDocumentSchema.optional(),
  plainText: text(20_000).optional(),
  jobDescription: text(12_000).optional(),

  consent: z.literal(true),
});

/* ------------------------------------------------------------------ AI response */

export const aiResponseSchema = z.object({
  ok: z.boolean(),

  provider: z.string().optional(),
  model: z.string().optional(),
  latencyMs: z.number().optional(),

  attempts: z
    .array(
      z.object({
        provider: z.string(),
        status: z.string(),
        error: z.string().optional(),
      })
    )
    .optional(),

  data: z.unknown().optional(),

  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean().optional(),
    })
    .optional(),
});
