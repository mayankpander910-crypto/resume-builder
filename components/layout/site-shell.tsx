import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="container-page py-10 md:py-14">
        {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.08] text-ink">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-subtle">{description}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </header>
  );
}
