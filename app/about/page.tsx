import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "About Resume Forge",
  description: "Why this resume builder exists, how it is built, what it deliberately does not do, and what stays free.",
};

const PRINCIPLES = [
  {
    title: "The core workflow is free and account-free",
    body: "Editing, every template, the ATS review and PDF export all work without signing up, without a watermark and without a download counter. There is nothing to upgrade to.",
  },
  {
    title: "Your resume stays in your browser",
    body: "The document lives in this browser's local storage. There is no database, no user table and no server-side copy of your content. Clearing site data deletes it everywhere it exists.",
  },
  {
    title: "AI is optional and never silent",
    body: "Nothing is sent to a model until you tick a consent box for that specific request. Every result is shown to you for review before it can touch your document, and the app is fully usable with no provider keys at all.",
  },
  {
    title: "The tool does not invent experience",
    body: "The assistant reorganises facts you supply. When it lacks a date, an employer or a number, it says so in a missing-information list instead of filling the gap with something plausible.",
  },
  {
    title: "Honest limits, stated plainly",
    body: "The ATS check is a rule-based review, not an employer's score. Extracted text from an import will need corrections. PDF output is produced by your own browser's print engine, so subtle differences between browsers are expected.",
  },
  {
    title: "No dark patterns",
    body: "No countdown timers, no fake scarcity, no pre-checked upsells, no exit-intent modals. The download button downloads, and the delete button deletes.",
  },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="About"
        title="A document tool, not a funnel"
        description="Resume Forge is a free resume editor with real typographic control, an honest ATS review and an assistant that asks before it sends anything anywhere."
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">Open workflow</Badge>
          <Badge>No account</Badge>
          <Badge>No watermark</Badge>
          <Badge>No analytics</Badge>
        </div>
      </PageHeader>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-w-[68ch] space-y-6">
          <section>
            <h2 className="text-[20px] leading-snug">Why it exists</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              Most free resume builders are free in the way a trial is free: you can write for twenty minutes, then the paywall appears at
              the exact moment you need the file. The document is usually trapped in someone else&apos;s database, and the templates are
              variations of one layout with the accent colour changed.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              This project takes the opposite position on both counts. The file is the deliverable, so exporting is a button that works on
              the first try. Templates are layout recipes rendered by one shared engine, which is why they can differ in structure — column
              counts, header treatment, heading rhythm, entry style, sidebar tinting — instead of only in colour.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] leading-snug">How it is built</h2>
            <div className="mt-2 space-y-2">
              {[
                ["One renderer, many templates", "A resume is a document tree. A template is a recipe describing page geometry, type scale, heading rules, entry layout and column splitting. Switching templates re-renders the same content; it never rewrites your text."],
                ["Print pipeline for PDF", "Export opens a print view that renders the same tree at the same measurements, and calls the browser's print dialog. You get a real vector PDF with selectable text — which is the format an ATS can actually read."],
                ["A real paginator", "Content is measured against the page box, so a second page starts where the first one ends rather than where a character count guesses. Headings do not get orphaned at the foot of a page."],
                ["Client-side parsing and checking", "Import and the ATS review run in your tab. The only network calls in the app are the optional AI endpoints and their status probe."],
                ["Server-side keys only", "Provider keys are read from the server environment and never reach the browser. The status endpoint reports which providers are configured, not what their keys are."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[8px] border border-line bg-surface p-3.5">
                  <p className="text-[13px] font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-subtle">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[20px] leading-snug">The rules it plays by</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => (
                <div key={principle.title} className="rounded-[8px] border border-line bg-surface p-3.5">
                  <p className="flex items-start gap-1.5 text-[12.5px] font-semibold text-ink">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-accent" /> {principle.title}
                  </p>
                  <p className="mt-1 pl-5 text-[12px] leading-relaxed text-subtle">{principle.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[20px] leading-snug">What it deliberately does not do</h2>
            <ul className="mt-2 space-y-1.5">
              {[
                "Store your resume on a server or sync it between devices — there are no accounts to sync with.",
                "Submit applications, scrape job boards or auto-fill employer portals.",
                "Claim a proprietary 'ATS score' that matches any particular vendor's ranking.",
                "Use trackers, heatmaps, session replay or advertising pixels.",
                "Charge for PDF export, remove a watermark, or ration downloads.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                  <Minus className="mt-1 size-3.5 shrink-0 text-subtle" /> {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] leading-snug">Known limitations</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              Everything lives in one browser profile. Two tabs of the editor are fine, but a private window or a different device starts
              empty — export your PDF before you switch, or keep the JSON export you can take from the editor&apos;s export menu. Import
              quality depends on the source file, and the AI assistant is only as useful as the facts you give it.
            </p>
          </section>

          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[13px] font-semibold text-ink">Use it</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-subtle">
              Start blank, start from a template, or import the file you already have. All three take under a minute.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Link href="/builder?new=1" className="inline-flex items-center gap-1 rounded-[5px] bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-accent-hover">
                Open the editor <ArrowRight className="size-3" />
              </Link>
              <Link href="/templates" className="rounded-[5px] border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2">
                Browse templates
              </Link>
              <Link href="/import" className="rounded-[5px] border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2">
                Import a file
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-eyebrow">At a glance</p>
            <dl className="mt-2 space-y-1.5">
              {[
                ["Templates", "64"],
                ["Layout archetypes", "16"],
                ["ATS checks", "18"],
                ["Account required", "No"],
                ["Watermark", "No"],
                ["AI providers", "5 supported, 0 required"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-2 border-b border-line pb-1 last:border-0">
                  <dt className="text-[11.5px] text-subtle">{label}</dt>
                  <dd className="text-[12px] font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">Feedback</p>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">
              Bug reports and template requests are welcome — the contact page explains how to reach the project.
            </p>
            <Link href="/contact" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
              Contact <ArrowRight className="size-3" />
            </Link>
          </div>
        </aside>
      </div>
    </SiteShell>
  );
}
