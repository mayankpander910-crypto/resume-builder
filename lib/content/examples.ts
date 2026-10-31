export interface ExampleLayer {
  heading: string;
  body: string;
}

export interface Example {
  slug: string;
  title: string;
  role: string;
  level: string;
  industry: string;
  templateId: string;
  description: string;
  /** Real sample lines — shown as an illustrative resume excerpt. */
  summary: string;
  bullets: string[];
  skills: string[];
  notes: ExampleLayer[];
  watchOut: string;
}

export const EXAMPLES: Example[] = [
  {
    slug: "senior-software-engineer",
    title: "Senior software engineer",
    role: "Software Engineering",
    level: "Senior",
    industry: "Technology",
    templateId: "stackline",
    description:
      "A platform engineer's resume where the first bullet of each role carries the outcome, and the stack sits at the bottom rather than the top.",
    summary:
      "Product-minded engineer with eight years building billing, scheduling and developer-platform systems. Comfortable owning a domain end to end — data model, API design and the interface teams use daily — and known for turning operational pain into small measurable systems.",
    bullets: [
      "Rebuilt the metering pipeline on an event-sourced ledger, cutting invoice disputes by 38% and reconciliation time from three days to under an hour.",
      "Designed a self-serve entitlement API adopted by six internal teams, removing roughly 15 engineering requests per week from the roadmap.",
      "Introduced contract tests and preview environments, taking deploy-related incidents from 11 a quarter to 2.",
    ],
    skills: ["TypeScript", "Go", "PostgreSQL", "Kafka", "AWS", "Terraform", "Observability"],
    notes: [
      { heading: "What makes it work", body: "Each role opens with an outcome that a non-engineer can evaluate, then earns the technical detail afterwards. The technology list is short and every item appears in the work above it." },
      { heading: "The structure", body: "Summary, skills, experience, projects, education. Skills sit high because recruitment screens for them; the summary does not repeat the stack." },
      { heading: "Length", body: "Two pages. The third role is deliberately compressed to two bullets — eight years of history does not deserve equal space." },
    ],
    watchOut: "Do not copy the metrics. If you do not know the percentage, describe the scope instead — \u201cacross six internal teams\u201d is defensible, an invented 38% is not.",
  },
  {
    slug: "machine-learning-engineer",
    title: "Machine learning engineer",
    role: "AI / Machine Learning",
    level: "Mid–Senior",
    industry: "Technology",
    templateId: "neural",
    description:
      "Model work described in terms of the system it shipped into — not benchmark chasing — with a publication section that does not dominate the page.",
    summary:
      "ML engineer focused on recommendation and ranking systems in production. Comfortable across the offline pipeline, the model and the serving path, including the evaluation work that decides what actually ships.",
    bullets: [
      "Shipped a candidate-ranking model that raised add-to-cart rate by 6.2% in a two-week A/B test across 1.4M sessions.",
      "Replaced a hand-tuned feature pipeline with a versioned feature store, cutting experiment setup from nine days to one.",
      "Built the offline evaluation harness now used by four teams, including slice-level reporting for cold-start users.",
    ],
    skills: ["Python", "PyTorch", "SQL", "Spark", "Airflow", "Feature stores", "A/B testing", "MLOps"],
    notes: [
      { heading: "What makes it work", body: "Every bullet answers \u201cdid it work in production?\u201d rather than \u201chow clever was the model?\u201d Hiring managers for ML roles screen hard for people who can measure their own work." },
      { heading: "The structure", body: "Publications sit below experience and are limited to the two that matter. For industry roles, a wall of papers signals a research candidate." },
      { heading: "Evaluation detail", body: "Naming the evaluation method (two-week A/B test, slice-level reporting) is what separates an ML engineer from someone who trained a model once." },
    ],
    watchOut: "Listing every framework you have imported does the opposite of what you want. Four tools you can defend beat fourteen you have seen.",
  },
  {
    slug: "data-analyst",
    title: "Data analyst",
    role: "Data & Analytics",
    level: "Mid",
    industry: "Technology / Finance",
    templateId: "dataline",
    description:
      "An analyst resume organised around decisions influenced, with the SQL and dashboard work framed as the method rather than the achievement.",
    summary:
      "Analyst who works on the questions behind the dashboards: pricing, retention and sales coverage. Builds the model, writes the query, then sits with the team until the number changes a decision.",
    bullets: [
      "Rebuilt the churn model used in the weekly revenue review, identifying a cohort that drove 22% of cancellations and prompting a retention experiment.",
      "Consolidated 14 overlapping sales dashboards into one governed model, ending a recurring disagreement about which number was correct.",
      "Automated a monthly reporting pack that had taken two analyst days, freeing that time for ad-hoc pricing analysis.",
    ],
    skills: ["SQL", "dbt", "Python (pandas)", "Looker", "Experiment design", "Data modelling"],
    notes: [
      { heading: "What makes it work", body: "\u201cDecisions influenced\u201d is the currency of analyst resumes. Each bullet ends with what someone did differently because of the analysis." },
      { heading: "The structure", body: "Experience first, skills second, tools inside the bullets. A standalone tools list reads as a course syllabus." },
      { heading: "On dashboards", body: "Building a dashboard is not an achievement; replacing fourteen of them is." },
    ],
    watchOut: "Avoid \u201ccreated reports\u201d. Every analyst creates reports. Say who used it and what changed.",
  },
  {
    slug: "product-manager",
    title: "Product manager",
    role: "Product Management",
    level: "Senior",
    industry: "Technology",
    templateId: "roadmap",
    description:
      "A PM resume that shows judgement: the bet, the trade-off, the evidence — instead of a feature shipped list.",
    summary:
      "Product manager for B2B workflow tools, working with engineering, design and a sales team that sells to operations buyers. Strongest on discovery in unglamorous domains and on saying no to the right things.",
    bullets: [
      "Led a permissions rebuild that unblocked two enterprise deals worth $410k ARR, after three failed attempts by an earlier team.",
      "Cut onboarding from 11 steps to 4 based on 23 support-call recordings, lifting week-one activation from 41% to 58%.",
      "Ran the quarterly prioritisation process across three squads, replacing a feature-ranking argument with a scored, published model.",
    ],
    skills: ["Discovery", "Roadmapping", "Experiment design", "SQL", "Pricing", "Stakeholder management"],
    notes: [
      { heading: "What makes it work", body: "Each bullet names a decision and its evidence. That is what a PM interview probes, so the resume should open those doors deliberately." },
      { heading: "The structure", body: "A sidebar keeps skills and tools out of the narrative, letting the main column read as a series of bets." },
      { heading: "The trade-off bullet", body: "The prioritisation story is the most senior bullet on the page because it describes influence without shipping anything." },
    ],
    watchOut: "\u201cLaunched X\u201d is not a PM achievement unless you say what happened after the launch.",
  },
  {
    slug: "ux-designer",
    title: "UX / product designer",
    role: "Product Design",
    level: "Mid",
    industry: "Design",
    templateId: "interact",
    description:
      "A designer's resume that treats case studies as evidence, with a portfolio link a reader can actually follow.",
    summary:
      "Product designer working on complex internal tools. Leads with research and systems thinking rather than visual style, and prefers to ship fewer, better-designed surfaces.",
    bullets: [
      "Redesigned the claims review tool used by 240 reviewers, cutting average handling time by 19% while reducing error-related rework.",
      "Built the first component library for the operations suite, adopted by three product teams and now covering 70% of new screens.",
      "Ran 30 usability sessions across two releases; the top three findings became the next quarter's roadmap.",
    ],
    skills: ["Figma", "Design systems", "Usability testing", "Information architecture", "Prototyping", "Accessibility"],
    notes: [
      { heading: "What makes it work", body: "Every claim has a number or a named artefact. Design resumes that only describe taste are read as junior." },
      { heading: "The structure", body: "Projects sit above education and are written like small case studies: context, constraint, outcome." },
      { heading: "The portfolio link", body: "In the masthead, clickable, and pointing at work the resume references. Reviewers will click it." },
    ],
    watchOut: "Never claim \u201cimproved UX\u201d. Name the task, the measurement and the before/after.",
  },
  {
    slug: "fresher-software-engineer",
    title: "Fresher / new graduate (software)",
    role: "Software Engineering",
    level: "Student",
    industry: "Technology",
    templateId: "projectfirst",
    description:
      "For a candidate whose best evidence is coursework and side projects: education and projects lead, with an honest skills list.",
    summary:
      "Final-year computer science student with a focus on backend systems. Built and deployed three projects used by real people, including a scheduling tool adopted by two campus departments.",
    bullets: [
      "Built a timetable scheduler serving 1,200 students, with a constraint solver written in Python and a React front end; still in use after six months.",
      "Wrote a from-scratch HTTP server in Go to understand the request lifecycle, then measured it against nginx on the same box.",
      "Contributed two merged pull requests to an open-source ORM, including a test for a bug I reported myself.",
    ],
    skills: ["Python", "Go", "React", "PostgreSQL", "Git", "Docker", "Data structures"],
    notes: [
      { heading: "What makes it work", body: "Projects are treated as experience: problem, build, result, and evidence of real use. \u201cStill in use after six months\u201d is the most persuasive line on the page." },
      { heading: "The structure", body: "Education first, projects second, coursework compressed into one line. No summary paragraph of adjectives." },
      { heading: "Honesty about level", body: "The summary says \u201cfinal-year student\u201d plainly. Trying to sound senior with no experience is the fastest way to lose credibility." },
    ],
    watchOut: "Do not list every language you have tried once. Three you can be interviewed on beats twelve you have seen in a tutorial.",
  },
  {
    slug: "marketing-manager",
    title: "Marketing manager",
    role: "Marketing",
    level: "Mid–Senior",
    industry: "Marketing",
    templateId: "marketline",
    description:
      "Campaign work framed by channel economics, with a clear answer to \u201cwhat did it cost and what did it return?\u201d",
    summary:
      "Marketing manager for a B2B SaaS product, owning lifecycle and paid channels. Works close to the sales pipeline and reports on cost per qualified opportunity rather than impressions.",
    bullets: [
      "Rebuilt the lifecycle email programme into six behaviour-triggered tracks, lifting trial-to-paid conversion from 3.1% to 5.4%.",
      "Cut paid acquisition cost per qualified opportunity by 27% by shifting 60% of budget from broad search to competitor terms.",
      "Launched the customer story programme that now supplies a third of sales-deck proof points.",
    ],
    skills: ["Lifecycle marketing", "Paid search", "HubSpot", "Copywriting", "Analytics", "Positioning"],
    notes: [
      { heading: "What makes it work", body: "Channel economics, not creativity adjectives. The reader can see the trade-off in each bullet." },
      { heading: "The structure", body: "Experience first with a banded masthead that keeps the page visually confident without eating space." },
      { heading: "Proof of taste", body: "One bullet about the customer story programme shows writing and editorial judgement, which a metrics-only resume misses." },
    ],
    watchOut: "\u201cIncreased brand awareness\u201d is unmeasurable. Say what you published, where, and what happened next.",
  },
  {
    slug: "finance-analyst",
    title: "Finance analyst",
    role: "Finance & Accounting",
    level: "Mid",
    industry: "Finance",
    templateId: "balance",
    description:
      "A deliberately conservative finance resume: precise, unembellished, and organised around the reporting cycle.",
    summary:
      "Financial analyst supporting a $180M business unit. Owns the monthly close pack, the rolling forecast and the variance commentary the leadership team actually reads.",
    bullets: [
      "Rebuilt the monthly close pack, cutting preparation time from six days to two while adding segment-level variance analysis.",
      "Identified a $2.4M accrual error during a forecast review, traced it to a mis-mapped cost centre and corrected the model.",
      "Built the three-scenario forecast now used in the annual planning cycle, including the sensitivity table for FX exposure.",
    ],
    skills: ["Financial modelling", "Variance analysis", "Excel (advanced)", "SQL", "ERP systems", "IFRS"],
    notes: [
      { heading: "What makes it work", body: "Specific, quiet, verifiable. Finance hiring managers read for precision, and flourish reads as risk." },
      { heading: "The structure", body: "Classic single column, serif type, double rule under the masthead. Zero colour beyond the text itself." },
      { heading: "The error bullet", body: "Describing a mistake you caught and fixed signals control awareness — unusually persuasive in a finance context." },
    ],
    watchOut: "Keep the numbers exact and consistent. A finance resume with a rounding inconsistency is self-defeating.",
  },
  {
    slug: "hr-business-partner",
    title: "HR business partner",
    role: "Human Resources",
    level: "Senior",
    industry: "Human Resources",
    templateId: "peoplefirst",
    description:
      "An HR resume with a warmer editorial layout, anchored on organisation design and manager effectiveness.",
    summary:
      "HR business partner for engineering and product organisations of 400–700 people. Works on organisation design, manager capability and the difficult conversations that precede restructures.",
    bullets: [
      "Partnered with three engineering directors through a reorganisation affecting 210 people, with voluntary attrition 4 points below the company average in the following six months.",
      "Designed a manager fundamentals programme attended by 90% of first-time managers, later adopted company-wide.",
      "Reduced time-to-hire for senior engineering roles from 62 to 41 days by rebuilding the interview panel structure.",
    ],
    skills: ["Organisation design", "Employee relations", "Coaching", "Compensation", "Change management", "HRIS"],
    notes: [
      { heading: "What makes it work", body: "The numbers are human ones — attrition, attendance, time-to-hire — and each bullet names the population it affected." },
      { heading: "The structure", body: "Serif headings and generous leading, with skills in the body rather than a sidebar: this reads as a person, not a policy." },
      { heading: "The hard bullet", body: "The reorganisation bullet is there because HR credibility rests on having done the difficult work, not the popular work." },
    ],
    watchOut: "Confidentiality matters. Describe scale and outcome, never individuals or anything identifying.",
  },
];

export const getExample = (slug: string): Example | undefined => EXAMPLES.find((example) => example.slug === slug);

export const EXAMPLE_LEVELS = Array.from(new Set(EXAMPLES.map((example) => example.level)));
export const EXAMPLE_INDUSTRIES = Array.from(new Set(EXAMPLES.map((example) => example.industry)));
