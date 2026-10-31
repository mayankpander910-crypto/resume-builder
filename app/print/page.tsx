"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { Button } from "@/components/ui/button";
import { PAGE_SPECS } from "@/lib/resume/renderer/metrics";

/**
 * Print / PDF view.
 *
 * The pages here are the same measured DOM nodes the editor renders, at exact
 * A4/Letter pixel dimensions (1px === 1/96in), so the PDF matches the preview
 * and text stays selectable. `@page { margin: 0 }` hands every millimetre of
 * layout to us instead of the browser.
 */
export default function PrintPage() {
  const doc = useResumeStore((state) => state.doc);
  const hydrate = useResumeStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  const template = getTemplate(doc.meta.templateId);
  const margin = PAGE_SPECS[doc.page.size];
  const fileName = `${doc.meta.name.replace(/[^\w-]+/g, "-").toLowerCase() || "resume"}-${
    doc.basics.fullName.replace(/[^\w-]+/g, "-").toLowerCase() || "cv"
  }`;

  return (
    <div className="min-h-[100dvh] bg-[#e9e6df]">
      <div className="rp-print-hide sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2.5">
          <Link href="/builder" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-subtle hover:text-ink">
            <ArrowLeft className="size-3.5" /> Back to editor
          </Link>
          <div className="mx-auto hidden items-center gap-2 text-[12px] text-subtle sm:flex">
            <Printer className="size-3.5" />
            {margin.label} · {margin.detail} · {pages} {pages === 1 ? "page" : "pages"} · {template.name}
          </div>
          <Button variant="primary" size="sm" onClick={() => window.print()} disabled={!ready}>
            {ready ? <Download className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
            Save as PDF
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="rp-print-hide mb-4 rounded-[6px] border border-line bg-surface px-3 py-2 text-[11.5px] leading-relaxed text-subtle">
          In the print dialog choose <strong className="text-ink">Destination: Save as PDF</strong>, set Margins to{" "}
          <strong className="text-ink">None</strong> and make sure “Background graphics” is on — that keeps the accent band and sidebar
          exactly as designed. Text stays selectable and links stay clickable.
        </p>
        {ready ? (
          <div className="flex flex-col items-center">
            <div className="rp-print-sheet">
              <ResumeCanvas doc={doc} template={template} mode="paged" onPageCount={setPages} printable />
            </div>
          </div>
        ) : (
          <div className="grid h-64 place-items-center text-subtle">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        <p className="rp-print-hide mt-4 text-center text-[11px] text-subtle">
          Suggested file name: <code className="rounded bg-surface px-1.5 py-0.5">{fileName}.pdf</code>
        </p>
      </div>
    </div>
  );
}
