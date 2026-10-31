import type {
  Basics,
  ResumeDocument,
  ResumeSection,
  SectionKind,
} from "@/types/resume";
import { defaultLayout, defaultPage, defaultTheme } from "@/lib/resume/schema/factory";

/**
 * Demo content used by the template gallery, examples pages and tests.
 * It is clearly labelled as sample data everywhere it appears in the UI.
 */

export const sampleBasics: Basics = {
  fullName: "Aarav Mehta",
  headline: "Senior Product Engineer · Platform & Developer Experience",
  email: "aarav.mehta@example.com",
  phone: "+91 98250 41120",
  location: "Bengaluru, India",
  website: "aaravmehta.dev",
  linkedin: "linkedin.com/in/aaravmehta",
  github: "github.com/aaravmehta",
  links: [{ id: "l1", label: "Writing", url: "aaravmehta.dev/notes" }],
  photoVisible: false,
};

const exp = [
  {
    id: "e1",
    role: "Senior Product Engineer",
    company: "Northwind Labs",
    location: "Bengaluru, IN",
    startDate: "Mar 2022",
    endDate: "",
    current: true,
    description:
      "Own the billing and entitlement platform used by every product surface; lead a pod of four engineers.",
    bullets: [
      "Rebuilt the metering pipeline on an event-sourced ledger, cutting invoice disputes by 38% and reconciliation time from three days to under an hour.",
      "Designed a self-serve entitlement API adopted by six internal teams, removing roughly 15 engineering requests per week from the roadmap.",
      "Introduced contract tests and preview environments, taking deploy-related incidents from 11 per quarter to 2.",
      "Mentored three engineers through promotion; run the weekly platform design review.",
    ],
    tech: ["TypeScript", "Node.js", "PostgreSQL", "Kafka", "AWS"],
  },
  {
    id: "e2",
    role: "Product Engineer",
    company: "Fieldline",
    location: "Remote",
    startDate: "Jul 2019",
    endDate: "Feb 2022",
    current: false,
    description: "Second engineering hire on a B2B scheduling product serving 40k weekly active users.",
    bullets: [
      "Shipped the scheduling engine that made multi-timezone booking possible, unlocking two enterprise logos worth $410k in annual contract value.",
      "Reduced page load p75 from 3.4s to 1.1s by code-splitting the calendar view and moving reads to a cached edge layer.",
      "Built the customer-facing audit log and permission model still in use across the product.",
    ],
    tech: ["React", "GraphQL", "Redis", "Playwright"],
  },
  {
    id: "e3",
    role: "Software Engineer",
    company: "Bytecraft Systems",
    location: "Pune, IN",
    startDate: "Jun 2017",
    endDate: "Jun 2019",
    current: false,
    description: "",
    bullets: [
      "Delivered the first version of a device provisioning console used by 200 field technicians.",
      "Automated release packaging, cutting the manual release checklist from 90 minutes to 12.",
    ],
    tech: ["Java", "Spring", "Docker"],
  },
];

const edu = [
  {
    id: "ed1",
    degree: "B.Tech, Computer Science and Engineering",
    institution: "National Institute of Technology, Surathkal",
    location: "Karnataka, IN",
    startDate: "2013",
    endDate: "2017",
    score: "CGPA 8.7 / 10",
    details: ["Coursework in distributed systems, compilers and applied statistics.", "Final-year thesis on incremental static analysis for JavaScript."],
  },
];

const skills = [
  { id: "s1", name: "Languages", items: ["TypeScript", "Python", "Go", "SQL", "Java"] },
  { id: "s2", name: "Platform", items: ["PostgreSQL", "Redis", "Kafka", "AWS", "Docker", "Terraform"] },
  { id: "s3", name: "Practice", items: ["System design", "API design", "Observability", "Mentoring", "Technical writing"] },
];

const projects = [
  {
    id: "p1",
    name: "Ledger",
    role: "Creator",
    url: "github.com/aaravmehta/ledger",
    startDate: "2023",
    endDate: "",
    description: "An append-only double-entry ledger library for Node.js.",
    bullets: [
      "1.8k GitHub stars and used in production by three companies I know of.",
      "Documented the balance-verification invariant that prevents the most common accounting bug.",
    ],
    tech: ["TypeScript", "PostgreSQL"],
  },
  {
    id: "p2",
    name: "Atlas Notes",
    role: "Designer and engineer",
    url: "atlasnotes.app",
    startDate: "2021",
    endDate: "2022",
    description: "A local-first research notebook built on CRDTs.",
    bullets: ["Offline editing with conflict-free merges across devices.", "Shipped keyboard-first editing and a full-text search index in IndexedDB."],
    tech: ["React", "Yjs", "IndexedDB"],
  },
  {
    id: "p3",
    name: "Slowquery",
    role: "Author",
    url: "",
    startDate: "2020",
    endDate: "",
    description: "A CLI that explains PostgreSQL query plans in plain English.",
    bullets: ["Used during on-call triage to cut plan-reading time in half."],
    tech: ["Go", "PostgreSQL"],
  },
];

const certs = [
  { id: "c1", name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2023", url: "" },
  { id: "c2", name: "Certified Kubernetes Application Developer", issuer: "CNCF", date: "2022", url: "" },
];

const achievements = [
  { id: "a1", title: "Engineering Excellence Award", issuer: "Northwind Labs", date: "2024", description: "Recognised for the metering rebuild and its measurable impact on revenue operations." },
  { id: "a2", title: "Speaker, NodeConf India", issuer: "NodeConf", date: "2023", description: "Talk: 'Append-only systems for people who fear ledgers'." },
];

const languages = [
  { id: "lg1", name: "English", proficiency: "Fluent" },
  { id: "lg2", name: "Hindi", proficiency: "Native" },
  { id: "lg3", name: "Marathi", proficiency: "Conversational" },
];

const publications = [
  {
    id: "pu1",
    title: "Incremental static analysis for module graphs",
    venue: "Proceedings of the India Software Engineering Conference",
    date: "2017",
    url: "",
    authors: "A. Mehta, R. Iyer",
  },
];

const volunteer = [
  {
    id: "v1",
    role: "Volunteer mentor",
    company: "Pragati Foundation",
    location: "Remote",
    startDate: "2021",
    endDate: "",
    current: true,
    description: "",
    bullets: ["Mentor four final-year students each year on portfolio projects and interview preparation."],
    tech: [],
  },
];

export type SampleLength = "short" | "medium" | "long";

const baseSections = (): ResumeSection[] => [
  { id: "sec-summary", kind: "summary", title: "Professional Summary", column: 0, visible: true, hideTitle: false, data: { text: "Product-minded engineer with eight years building billing, scheduling and developer-platform systems. Comfortable owning a domain end to end — from data model and API design through to the interface teams use daily. Known for turning vague operational pain into small, measurable systems." } },
  { id: "sec-experience", kind: "experience", title: "Work Experience", column: 0, visible: true, hideTitle: false, data: { items: exp.map((e) => ({ ...e, bullets: [...e.bullets], tech: [...e.tech] })) } },
  { id: "sec-projects", kind: "projects", title: "Selected Projects", column: 0, visible: true, hideTitle: false, data: { items: projects.map((p) => ({ ...p, bullets: [...p.bullets], tech: [...p.tech] })) } },
  { id: "sec-education", kind: "education", title: "Education", column: 0, visible: true, hideTitle: false, data: { items: edu.map((e) => ({ ...e, details: [...e.details] })) } },
  { id: "sec-skills", kind: "skills", title: "Skills", column: 0, visible: true, hideTitle: false, data: { groups: skills.map((s) => ({ ...s, items: [...s.items] })), display: "inline" } },
  { id: "sec-certifications", kind: "certifications", title: "Certifications", column: 0, visible: true, hideTitle: false, data: { items: certs.map((c) => ({ ...c })) } },
  { id: "sec-achievements", kind: "achievements", title: "Achievements", column: 0, visible: true, hideTitle: false, data: { items: achievements.map((a) => ({ ...a })) } },
  { id: "sec-languages", kind: "languages", title: "Languages", column: 0, visible: true, hideTitle: false, data: { items: languages.map((l) => ({ ...l })), display: "inline" } },
  { id: "sec-publications", kind: "publications", title: "Publications", column: 0, visible: true, hideTitle: false, data: { items: publications.map((p) => ({ ...p })) } },
  { id: "sec-volunteer", kind: "volunteer", title: "Volunteer Experience", column: 0, visible: true, hideTitle: false, data: { items: volunteer.map((v) => ({ ...v, bullets: [...v.bullets], tech: [...v.tech] })) } },
];

export const sampleSections = (length: SampleLength = "medium"): ResumeSection[] => {
  const all = baseSections();
  if (length === "short") {
    const keep = new Set(["summary", "experience", "education", "skills"]);
    return all
      .filter((s) => keep.has(s.kind))
      .map((s) =>
        s.kind === "experience"
          ? { ...s, data: { items: (s.data as { items: unknown[] }).items.slice(0, 2) } }
          : s,
      ) as ResumeSection[];
  }
  if (length === "long") {
    const extra = all.find((s) => s.kind === "experience") as Extract<ResumeSection, { kind: "experience" }>;
    const clones = extra.data.items.map((item) => ({
      ...item,
      id: `${item.id}-b`,
      company: `${item.company} (contract)`,
      bullets: [...item.bullets, ...item.bullets],
    }));
    return all.map((s) =>
      s.kind === "experience"
        ? { ...s, data: { items: [...extra.data.items, ...clones] } }
        : s,
    ) as ResumeSection[];
  }
  return all;
};

export const buildSampleResume = (templateId = "meridian", length: SampleLength = "medium"): ResumeDocument => {
  const now = new Date().toISOString();
  return {
    meta: { id: `sample-${templateId}`, name: "Sample resume", createdAt: now, updatedAt: now, templateId },
    basics: { ...sampleBasics, links: [...sampleBasics.links] },
    sections: sampleSections(length),
    theme: defaultTheme(),
    page: defaultPage(),
    layout: defaultLayout(),
  };
};
