import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Resume Forge home">
      <span className="relative grid size-7 place-items-center rounded-[6px] bg-ink text-white transition-colors group-hover:bg-accent">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3.2 2.2h6.1L12.8 5.7v8.1H3.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M9.1 2.3v3.5h3.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5.3 8.4h5.4M5.3 10.6h3.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
        Resume<span className="text-subtle">Forge</span>
      </span>
    </Link>
  );
}
