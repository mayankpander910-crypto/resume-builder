import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="grid size-12 place-items-center rounded-[10px] border border-line bg-surface">
          <FileQuestion className="size-5 text-accent" />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">404</p>
        <h1 className="mt-1 text-[clamp(1.5rem,3.6vw,2.2rem)] leading-tight">That page is not here</h1>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-subtle">
          The link may be old, or a template id may have been renamed. Try the template library, or go straight to the editor — your
          document is untouched.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link href="/builder" className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent px-4 py-2 text-[13.5px] font-medium text-white hover:bg-accent-hover">
            Open the editor <ArrowRight className="size-4" />
          </Link>
          <Link href="/templates" className="rounded-[6px] border border-line-strong px-4 py-2 text-[13.5px] font-medium text-ink hover:bg-surface-2">
            Browse templates
          </Link>
          <Link href="/" className="rounded-[6px] px-4 py-2 text-[13.5px] font-medium text-subtle hover:text-ink">
            Home
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
