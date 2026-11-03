
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/templates", label: "Templates" },
  { href: "/ai-resume", label: "AI Builder" },
  { href: "/ats-checker", label: "ATS Checker" },
];

const RESOURCES = [
  { href: "/examples", label: "Resume Examples" },
  { href: "/guides", label: "Career Guides" },
  { href: "/blog", label: "Blog & Insights" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isResourceActive = RESOURCES.some(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setResourcesOpen(false);
  }, [pathname]);

  const linkClass = (active: boolean) =>
    cn(
      "relative rounded-md px-3 py-2 text-[13.5px] font-medium",
      "transition-colors duration-200",
      active
        ? "text-ink"
        : "text-subtle hover:text-ink"
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-canvas/95 backdrop-blur-xl",
        "border-b transition-all duration-300",
        scrolled
          ? "border-line shadow-[0_2px_12px_rgba(0,0,0,0.035)]"
          : "border-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">

        {/* Logo */}
        <div className="shrink-0">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex flex-1 items-center justify-center gap-1"
          aria-label="Main navigation"
        >
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Resources Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setResourcesOpen((value) => !value)
              }
              aria-expanded={resourcesOpen}
              className={cn(
                linkClass(isResourceActive),
                "inline-flex items-center gap-1.5"
              )}
            >
              Resources

              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  resourcesOpen && "rotate-180"
                )}
              />
            </button>

            {resourcesOpen && (
              <div
                className={cn(
                  "absolute left-0 top-full mt-3 w-52",
                  "rounded-xl border border-line",
                  "bg-surface p-1.5 shadow-xl",
                  "animate-in fade-in slide-in-from-top-2 duration-200"
                )}
              >
                {RESOURCES.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setResourcesOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-2.5",
                        "text-[13px] font-medium transition-colors",
                        active
                          ? "bg-surface-2 text-ink"
                          : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex shrink-0 items-center">
          <Button asChild variant="primary" size="sm">
            <Link href="/builder?new=1">
              Create my resume
              <ArrowUpRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex size-10 items-center justify-center",
            "rounded-lg border border-line text-ink",
            "transition-colors hover:bg-surface-2",
            "md:hidden"
          )}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-line bg-canvas md:hidden">
          <nav
            className="container-page flex flex-col gap-1 py-4"
            aria-label="Mobile navigation"
          >
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-medium",
                    "transition-colors",
                    active
                      ? "bg-surface-2 text-ink"
                      : "text-ink-2 hover:bg-surface-2"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Resources */}
            <div className="mt-1 border-t border-line pt-3">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                Resources
              </p>

              {RESOURCES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile CTA */}
            <div className="mt-3 border-t border-line pt-4">
              <Button
                asChild
                variant="primary"
                size="md"
                className="w-full"
              >
                <Link href="/builder?new=1">
                  Create my resume
                  <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
