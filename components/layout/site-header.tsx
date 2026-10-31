"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/templates", label: "Templates" },
  { href: "/ai-resume", label: "AI builder" },
  { href: "/ats-checker", label: "ATS checker" },
  { href: "/examples", label: "Examples" },
  { href: "/guides", label: "Guides" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-canvas/85 backdrop-blur-md transition-colors",
        scrolled ? "border-line" : "border-transparent",
      )}
    >
      <div className="container-page flex h-14 items-center justify-between gap-6">
        <div className="flex items-center gap-7">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[4px] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    active ? "text-ink" : "text-subtle hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/builder"
            className="text-[13px] font-medium text-subtle transition-colors hover:text-ink"
          >
            Open editor
          </Link>
          <Button asChild variant="primary" size="sm">
            <Link href="/builder?new=1">
              Create my resume
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-9 items-center justify-center rounded-[5px] border border-line text-ink-2 md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-line bg-surface md:hidden">
          <nav className="container-page grid gap-0.5 py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[4px] px-2 py-2 text-[13.5px] font-medium text-ink-2 hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-line pt-3">
              <Button asChild variant="primary" size="md">
                <Link href="/builder?new=1">Create my resume</Link>
              </Button>
              <Button asChild variant="ghost" size="md">
                <Link href="/builder">Open editor</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
