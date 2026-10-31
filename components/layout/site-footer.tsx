import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/builder", label: "Resume editor" },
      { href: "/import", label: "Import a resume" },
      { href: "/templates", label: "Template library" },
      { href: "/ai-resume", label: "AI resume builder" },
      { href: "/ats-checker", label: "ATS resume checker" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/examples", label: "Resume examples" },
      { href: "/guides", label: "Career guides" },
      { href: "/blog", label: "Blog" },
      { href: "/guides/resume-writing-checklist", label: "Writing checklist" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-[12.5px] leading-relaxed text-subtle">
            A resume builder that respects your time and your data. Everything runs in your browser; an account is
            never required.
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-subtle">
            <span className="inline-block size-1.5 rounded-full bg-ok" aria-hidden />
            No signup · No paywall · Local-first
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-ink-2 transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-4 text-[11.5px] text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Resume Forge. Built as an open, free tool.</p>
          <p>
            Sample resumes and testimonials on this site are illustrative demo content, clearly labelled as such.
          </p>
        </div>
      </div>
    </footer>
  );
}
