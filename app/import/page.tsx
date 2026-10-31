import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FileWarning, ScanLine, ShieldCheck, SplitSquareVertical } from "lucide-react";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { ImportLaunch } from "@/components/import/import-launch";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Import an existing resume",
  description:
    "Bring a PDF or Word resume into the editor. Text is extracted in your browser, split into sections, and nothing is uploaded.",
};

export default function ImportPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Import"
        title="Start from the resume you already have"
        description="Import does not try to rebuild your design pixel for pixel. It reads the text, finds the sections, and lets you re-apply any of the 64 templates on top."
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">Runs locally</Badge>
          <Badge>PDF · DOCX · TXT</Badge>
          <Badge>You approve each section</Badge>
        </div>
      </PageHeader>

      <div className="container-page grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="space-y-3">
          <ImportLaunch />

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: ScanLine,
                title: "Text extraction, not OCR",
                body: "PDF text is read from the file's own text layer. Scans and screenshots have no text layer, so they are rejected rather than silently mangled.",
              },
              {
                icon: SplitSquareVertical,
                title: "Heading-first parsing",
                body: "The parser looks for section headings, then splits each block into entries, dates, sub-lines and bullets. Ambiguous blocks are shown to you instead of guessed.",
              },
              {
                icon: ShieldCheck,
                title: "Nothing leaves the device",
                body: "Extraction and parsing both run in this tab. There is no upload endpoint, no queue, and no copy of your resume on a server.",
              },
              {
                icon: FileWarning,
                title: "Expect to fix a little",
                body: "Two-column layouts, tables and text boxes flatten differently in every generator. Budget five minutes to correct dates and grouping.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[9px] border border-line bg-surface p-3.5">
                <item.icon className="size-4 text-accent" />
                <p className="mt-2 text-[12.5px] font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-subtle">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">What happens after you pick a file</p>
            <ol className="mt-2 space-y-2">
              {[
                "The file is read in your browser and the text layer is extracted.",
                "The parser detects headings, roles, dates, skills and unmapped blocks.",
                "The editor opens with the import dialog pre-filled.",
                "You tick the sections you want, choose replace or append, and apply.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">{index + 1}</span>
                  <span className="text-[12px] leading-relaxed text-ink-2">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">Why not preserve the original design?</p>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">
              Recreating an arbitrary layout faithfully means storing a document tree per file — and most imported designs are the reason
              the resume needs work. Keeping the content and replacing the frame is more useful, and the frame is where templates earn their
              keep.
            </p>
            <Link href="/templates" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
              Browse templates <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">Common problems</p>
            <ul className="mt-1.5 space-y-1">
              {[
                "Scanned PDF — no text to read. Re-export from the source app.",
                "Word text boxes are skipped; move that content into the body first.",
                "Tables can arrive as one run of text. Fix in the editor.",
              ].map((line) => (
                <li key={line} className="flex gap-1.5 text-[11.5px] leading-relaxed text-subtle">
                  <Check className="mt-0.5 size-3 shrink-0 text-warn" /> {line}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </SiteShell>
  );
}
