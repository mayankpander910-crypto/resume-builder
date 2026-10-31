import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FileText,
  GripVertical,
  Layers,
  Lock,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { HeroPreview } from "@/components/landing/hero-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TEMPLATES } from "@/lib/templates/registry";
import { TEMPLATE_CATEGORIES } from "@/types/template";
import { ResumeThumb } from "@/components/resume/ResumeThumb";
import { buildTemplatePreview } from "@/lib/templates/preview-doc";
import { EXAMPLES } from "@/lib/content/examples";

const FEATURED = ["meridian", "frontwise", "launchpad", "gazette", "columnar", "sentinel"];

const FAQ = [
  {
    q: "Is it actually free?",
    a: "Yes. Every template, every editor feature, AI assistance, the ATS checker and PDF export are free and unmetered. There is no account, no watermark and no paywall anywhere in the product.",
  },
  {
    q: "Do I need an account to save my resume?",
    a: "No. Your resume is saved in this browser's local storage as you type, and it will be here when you come back on the same device. You can also export your resume as a JSON file to move it between devices.",
  },
  {
    q: "Where does my data go?",
    a: "Nowhere by default. Resume content stays in your browser. Files you import are parsed locally. The only time text leaves your device is when you explicitly press an AI action and tick the consent box — and then only the relevant excerpt is sent to the configured provider.",
  },
  {
    q: "How does the AI work if there is no API key?",
    a: "The AI assistant needs at least one provider key to be configured by whoever runs the deployment (Gemini, Groq, OpenRouter, Cerebras or Hugging Face). Without a key the editor explains why and everything else keeps working. Nothing is faked.",
  },
  {
    q: "Will the AI invent experience for me?",
    a: "No. Every prompt forbids inventing employers, dates, metrics, certifications or skills, and the assistant asks for missing facts instead of guessing. You always review and approve a suggestion before it enters your resume.",
  },
  {
    q: "Will my PDF be readable by an applicant tracking system?",
    a: "The PDF is real text, not an image, with selectable text and working links. ATS-friendliness also depends on the template and your content, which is why every template carries an ATS rating and the checker scores your actual draft.",
  },
  {
    q: "What page sizes are supported?",
    a: "A4 and US Letter, with independent margins per side, multi-page flow with section-level page breaks, and optional page numbers.",
  },
  {
    q: "Can I switch templates without losing my writing?",
    a: "Always. Templates only change layout and styling; your content lives in a separate, strongly typed data model. Switching is a single undoable action.",
  },
];

export default function HomePage() {
  const featured = FEATURED.map((id) => TEMPLATES.find((template) => template.id === id)!).filter(Boolean);

  return (
    <SiteShell>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line bg-canvas">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, #e8f1ee 0%, transparent 45%), radial-gradient(circle at 85% 15%, #f2ecdF 0%, transparent 40%)",
          }}
          aria-hidden
        />
        <div className="container-page relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:py-20">
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                <span className="size-1.5 rounded-full bg-accent" /> Free · no account · no paywall
              </Badge>
              <span className="text-[11.5px] text-subtle">64 templates · A4 + Letter · local-first</span>
            </div>
            <h1 className="mt-4 text-[clamp(2.1rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
              A resume that reads
              <br />
              like you wrote it
              <span className="text-accent"> on your best day.</span>
            </h1>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
              Resume Forge is a real document editor for resumes: 64 distinct layouts, drag-and-drop structure, honest AI
              writing help and a PDF that comes out exactly as previewed. No signup, no watermark, no upsell.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button asChild variant="primary" size="lg">
                <Link href="/builder?new=1">
                  Create my resume <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/templates">Explore templates</Link>
              </Button>
            </div>
            <ul className="mt-6 grid max-w-lg gap-1.5 text-[12.5px] text-ink-2 sm:grid-cols-2">
              {["Edits autosave in your browser", "ATs score on your draft, not a guess", "Drag sections between columns", "Selectable-text PDF export"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-accent" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <HeroPreview />
          </div>
        </div>
        <div className="border-t border-line bg-surface/60">
          <div className="container-page grid grid-cols-2 gap-4 py-4 text-[11.5px] text-subtle sm:grid-cols-4">
            {[
              ["64", "distinct templates"],
              ["12", "content sections"],
              ["A4 / Letter", "exact page geometry"],
              ["0", "accounts required"],
            ].map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold text-ink">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- how it works */}
      <section className="border-b border-line">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="text-eyebrow">Three steps, one sitting</p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.12]">
              Start from nothing, a file, or a job description
            </h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-subtle">
              Most people finish a first draft in under 15 minutes. The editor never hides behind a sign-up step, so you can start
              writing immediately and decide about the details later.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              {
                icon: FileText,
                step: "01",
                title: "Bring what you have",
                body: "Type it in, paste unstructured notes, or import a PDF/DOCX. Imports are parsed in your browser and shown to you section by section before anything is saved.",
                href: "/builder?new=1",
                cta: "Start blank",
              },
              {
                icon: Layers,
                step: "02",
                title: "Shape the structure",
                body: "Pick one of 64 templates, then drag sections between columns, resize the sidebar and tune typography until the hierarchy reads the way you think.",
                href: "/templates",
                cta: "Browse layouts",
              },
              {
                icon: ClipboardCheck,
                step: "03",
                title: "Check and export",
                body: "Run the ATS checks and the AI review, fix what matters, then export an A4 or Letter PDF whose pages match the canvas exactly.",
                href: "/ats-checker",
                cta: "See the checker",
              },
            ].map((item) => (
              <article key={item.step} className="group rounded-[9px] border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                <div className="flex items-center justify-between">
                  <span className="grid size-7 place-items-center rounded-[6px] bg-accent-soft text-accent-ink">
                    <item.icon className="size-3.5" />
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[0.14em] text-subtle">{item.step}</span>
                </div>
                <h3 className="mt-3 text-[14.5px] font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-subtle">{item.body}</p>
                <Link href={item.href} className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                  {item.cta} <ArrowUpRight className="size-3" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- template library */}
      <section className="border-b border-line bg-surface">
        <div className="container-page py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-eyebrow">The library</p>
              <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.12]">64 layouts, built from real hiring conventions</h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-subtle">
                Not a colour slider. Each template is a distinct structural idea — chronology, sidebar rail, timeline, editorial
                masthead, academic CV — carrying its own typography, spacing and ATS classification.
              </p>
            </div>
            <Button asChild variant="secondary" size="md">
              <Link href="/templates">
                Open the gallery <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((template) => {
              const preview = buildTemplatePreview(template.id, "short");
              return (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="group overflow-hidden rounded-[7px] border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card)]"
                >
                  <ResumeThumb doc={preview} template={template} width={200} className="mx-auto !border-0 !border-b" />
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <span className="truncate text-[11.5px] font-medium text-ink">{template.name}</span>
                    <span className="shrink-0 text-[10px] text-subtle">{template.atsScore}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {TEMPLATE_CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/templates?category=${category.id}`}
                className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-subtle transition-colors hover:border-accent hover:text-accent"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- editor showcase */}
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-14 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-eyebrow">Drag &amp; drop, for real</p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.12]">
              Reorder the document, not a settings list
            </h2>
            <p className="mt-2.5 max-w-[46ch] text-[14px] leading-relaxed text-subtle">
              Grab a section on the canvas itself and drop it anywhere in either column. The document reflows as a real document —
              CSS grid and flexbox, never absolute positioning — and the PDF inherits the same layout because it is the same DOM.
            </p>
            <ul className="mt-5 grid gap-2.5">
              {[
                ["Move between columns", "Sections hop from main column to sidebar and back, taking their content with them."],
                ["Resize the rail", "Drag the sidebar width from 22% to 46% and watch the main column re-balance."],
                ["Keyboard accessible", "Every drag has a button equivalent, plus ⌘Z for the inevitable regret."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-2.5">
                  <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                    <Check className="size-2.5" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-ink">{title}</span>
                    <span className="block text-[12.5px] leading-relaxed text-subtle">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="primary" size="md" className="mt-5">
              <Link href="/builder?new=1">
                Try the editor <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="rounded-[10px] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <span className="text-[11px] font-medium text-subtle">Layout</span>
              <span className="ml-auto flex items-center gap-1 text-[10.5px] text-subtle">
                <GripVertical className="size-3 text-accent" /> dragging “Projects”
              </span>
            </div>
            <div className="grid gap-2 bg-[#f2efe9] p-3 sm:grid-cols-[1.6fr_1fr]">
              <div className="rounded-[4px] border border-line bg-white p-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-subtle">Main column · 66%</p>
                {["Professional summary", "Work experience", "Selected projects"].map((item, index) => (
                  <div
                    key={item}
                    className={`mt-1.5 rounded-[3px] border px-2 py-1.5 text-[10.5px] ${
                      index === 2 ? "border-accent bg-accent-soft text-accent-ink shadow-sm" : "border-line text-ink-2"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <GripVertical className="size-2.5 opacity-50" />
                      {item}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <span className="block h-[3px] w-full rounded-full bg-line" />
                      <span className="block h-[3px] w-4/5 rounded-full bg-line" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-[4px] border border-line bg-[#eef3f0] p-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-subtle">Sidebar · 34%</p>
                {["Skills", "Education", "Languages"].map((item) => (
                  <div key={item} className="mt-1.5 rounded-[3px] border border-line bg-white/80 px-2 py-1.5 text-[10.5px] text-ink-2">
                    <div className="flex items-center gap-1">
                      <GripVertical className="size-2.5 opacity-50" />
                      {item}
                    </div>
                  </div>
                ))}
                <div className="mt-1.5 rounded-[3px] border border-dashed border-accent/50 px-2 py-1.5 text-center text-[10px] text-accent">
                  drop here
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- AI */}
      <section className="border-b border-line bg-surface">
        <div className="container-page py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-[10px] border border-line bg-canvas p-3 shadow-[var(--shadow-card)]">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-[4px] bg-accent-soft text-accent-ink">
                    <Sparkles className="size-3.5" />
                  </span>
                  <span className="text-[12px] font-semibold text-ink">AI assistant</span>
                  <span className="ml-auto text-[10px] text-subtle">suggests · never invents</span>
                </div>
                <div className="rounded-[6px] border border-line bg-surface p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-subtle">Selected · Work experience</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-subtle line-through">
                    Responsible for the billing platform and helping the team with various migration tasks.
                  </p>
                  <div className="mt-2 rounded-[5px] border border-accent/25 bg-accent-soft/50 p-2">
                    <p className="text-[11px] leading-relaxed text-ink">
                      Rebuilt the metering pipeline on an event-sourced ledger, cutting invoice disputes by 38% and reconciliation
                      time from three days to under an hour.
                    </p>
                    <p className="mt-1.5 text-[10px] text-subtle">Only facts from your draft · 1 suggestion</p>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <span className="rounded-[4px] bg-accent px-2 py-1 text-[10.5px] font-medium text-white">Insert into resume</span>
                    <span className="rounded-[4px] border border-line px-2 py-1 text-[10.5px] text-subtle">Discard</span>
                  </div>
                </div>
                <div className="mt-2 rounded-[5px] border border-line bg-surface px-2 py-1.5 text-[10px] leading-relaxed text-subtle">
                  <strong className="text-ink">Missing detail:</strong> no percentage for reconciliation time was supplied. We left it
                  as written instead of inventing one.
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-eyebrow">AI that respects the facts</p>
              <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.12]">
                Writing help with a hard rule against invention
              </h2>
              <p className="mt-2.5 max-w-[48ch] text-[14px] leading-relaxed text-subtle">
                Improve a summary, sharpen bullets, fix grammar, tailor wording to a posting, or get a recruiter-style review. The
                assistant is forbidden from creating employers, dates, metrics, certifications or skills — and it tells you what it
                could not know.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  { icon: Wand2, title: "Improve a section", body: "Rewrites for clarity and rhythm, keeping your facts." },
                  { icon: Target, title: "Tailor to a posting", body: "Keyword coverage without stuffing." },
                  { icon: ClipboardCheck, title: "Full review", body: "Structure, relevance, weak bullets." },
                  { icon: Zap, title: "Provider fallback", body: "Gemini → Groq → OpenRouter → … so one quota cannot stop you." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[7px] border border-line bg-canvas p-2.5">
                    <item.icon className="size-3.5 text-accent" />
                    <p className="mt-1.5 text-[12.5px] font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-subtle">{item.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-1.5 rounded-[6px] border border-line bg-surface px-2.5 py-2 text-[11.5px] leading-relaxed text-subtle">
                <Lock className="mt-0.5 size-3 shrink-0 text-accent" />
                AI needs a provider key configured by whoever runs this deployment. You are always asked for consent before any
                text leaves your browser — and the editor is fully usable if AI is off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- ATS */}
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-14 md:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-eyebrow">Parsing, honestly assessed</p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.12]">An ATS check that explains itself</h2>
            <p className="mt-2.5 max-w-[46ch] text-[14px] leading-relaxed text-subtle">
              The checker runs in your browser against your actual draft: contact completeness, section presence, bullet quality,
              date consistency, length and keyword coverage against a posting. Every score is attached to the check that produced it.
            </p>
            <p className="mt-3 max-w-[46ch] rounded-[6px] bg-surface border border-line px-2.5 py-2 text-[11.5px] leading-relaxed text-subtle">
              We say this plainly: the number is our heuristic, not a score from any employer&apos;s system. Use it to catch fixable
              mistakes, not as a promise.
            </p>
            <Button asChild variant="secondary" size="md" className="mt-4">
              <Link href="/ats-checker">
                Run the checker <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="rounded-[10px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-subtle">Overall</p>
                <p className="text-[26px] font-semibold leading-none text-ink">
                  82<span className="text-[13px] text-subtle">/100</span>
                </p>
                <p className="mt-1 text-[11px] text-ok">Good — 3 fixable issues</p>
              </div>
              <div className="grid w-[60%] grid-cols-2 gap-1.5">
                {[
                  ["Contact", "Pass"],
                  ["Sections", "Pass"],
                  ["Bullets", "Warn"],
                  ["Keywords", "64%"],
                ].map(([label, state]) => (
                  <div key={label} className="rounded-[4px] border border-line px-1.5 py-1">
                    <p className="text-[9.5px] uppercase tracking-[0.08em] text-subtle">{label}</p>
                    <p className={`text-[10.5px] font-medium ${state === "Pass" ? "text-ok" : "text-warn"}`}>{state}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                ["warn", "Bullet starts with “Responsible for”", "Lead with the action verb instead."],
                ["warn", "Two different date formats", "Pick “Mar 2022” or “2022” and use it everywhere."],
                ["pass", "Every role has a date range", "Chronology checks will pass."],
              ].map(([tone, title, detail]) => (
                <div key={title} className="flex gap-2 rounded-[5px] border border-line bg-canvas px-2 py-1.5">
                  <span className={`mt-1 size-1.5 shrink-0 rounded-full ${tone === "pass" ? "bg-ok" : "bg-warn"}`} />
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">{title}</p>
                    <p className="text-[11px] text-subtle">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- examples */}
      <section className="border-b border-line bg-surface">
        <div className="container-page py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow">Worked examples</p>
              <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.12]">See a finished resume before you write yours</h2>
            </div>
            <Button asChild variant="ghost" size="md">
              <Link href="/examples">
                All examples <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.slice(0, 3).map((example) => (
              <Link
                key={example.slug}
                href={`/examples/${example.slug}`}
                className="group rounded-[8px] border border-line bg-canvas p-4 transition-colors hover:border-line-strong"
              >
                <Badge tone="neutral">{example.role}</Badge>
                <h3 className="mt-2.5 text-[14.5px] font-semibold text-ink">{example.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-subtle">{example.description}</p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                  Read the breakdown <ArrowUpRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- testimonials */}
      <section className="border-b border-line">
        <div className="container-page py-14 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[clamp(1.35rem,2.6vw,1.75rem)]">What people would say if this had users yet</h2>
            <Badge tone="warn">Sample copy — illustrative, not real customers</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-subtle">
            Resume Forge is a new, open project. Rather than invent reviews, the three notes below are written examples showing the
            kinds of outcomes the tool is designed for. They are not testimonials from real people and should not be read as such.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              {
                quote:
                  "The part I expected to hate was rearranging sections. Dropping the sidebar from three sections to two changed how the whole first page reads.",
                who: "Sample scenario · product designer, 6 years",
              },
              {
                quote:
                  "I imported a five-year-old PDF, fixed the dates it guessed wrong, and had a current draft in about twelve minutes.",
                who: "Sample scenario · backend engineer, career change",
              },
              {
                quote:
                  "The ATS report told me two roles were missing end dates. That is the kind of small thing that actually costs callbacks.",
                who: "Sample scenario · final-year student",
              },
            ].map((item) => (
              <figure key={item.who} className="rounded-[8px] border border-line bg-surface p-4">
                <blockquote className="text-[13px] leading-relaxed text-ink-2">“{item.quote}”</blockquote>
                <figcaption className="mt-3 text-[11px] text-subtle">{item.who}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- FAQ */}
      <section className="border-b border-line bg-surface">
        <div className="container-page grid gap-8 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-eyebrow">Questions</p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] leading-[1.12]">The things people ask first</h2>
            <p className="mt-2.5 max-w-[38ch] text-[13.5px] leading-relaxed text-subtle">
              If something here is still unclear, the honest answer is usually in the privacy page or the README — both are written
              for humans.
            </p>
          </div>
          <Accordion type="single" collapsible className="border-t border-line">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ------------------------------------------------------------------- CTA */}
      <section className="bg-canvas">
        <div className="container-page py-14 md:py-20">
          <div className="relative overflow-hidden rounded-[12px] border border-line bg-ink px-6 py-10 text-white md:px-12 md:py-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{ backgroundImage: "radial-gradient(circle at 85% 20%, #0d6b5f 0%, transparent 55%)" }}
              aria-hidden
            />
            <div className="relative max-w-2xl">
              <h2 className="text-[clamp(1.5rem,3.4vw,2.25rem)] leading-[1.1] text-white">Your next resume is 15 minutes away.</h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-white/70">
                No account, no card, no watermark. Open the editor, and everything you type stays in your browser.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button asChild variant="primary" size="lg">
                  <Link href="/builder?new=1">
                    Create my resume <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:border-white/25">
                  <Link href="/templates">Browse 64 templates</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
