import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bug, FileText, Lock, Wrench } from "lucide-react";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { ContactForm } from "@/components/contact/contact-form";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Contact",
  description: "Report a bug, request a template, or ask a privacy question about Resume Forge.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Contact"
        title="Tell us what broke"
        description="Bug reports with a browser and a template name get fixed. Details on how to reproduce a layout problem are worth more than a paragraph of frustration."
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">No contact database</Badge>
          <Badge>Composes in your mail app</Badge>
        </div>
      </PageHeader>

      <div className="container-page grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ContactForm />

        <aside className="space-y-3">
          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">Faster answers</p>
            <div className="mt-2 space-y-2">
              {[
                { icon: Bug, title: "A rendering problem", body: "Include the template id, the browser, and whether print preview matches the editor." },
                { icon: FileText, title: "A bad import", body: "Tell us the source app (Word, Google Docs, LaTeX) — parsers behave differently per generator." },
                { icon: Lock, title: "A privacy question", body: "Ask about anything on the privacy page. If something is unclear there, that is a documentation bug." },
                { icon: Wrench, title: "A template request", body: "Say the role, the industry and the seniority. Structural ideas (columns, header style) are welcome." },
              ].map((item) => (
                <div key={item.title} className="flex gap-2">
                  <item.icon className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  <div>
                    <p className="text-[12px] font-medium text-ink">{item.title}</p>
                    <p className="text-[11px] leading-relaxed text-subtle">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">Before you write</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-subtle">
              Never attach your real resume unless you are comfortable sending it. For layout bugs, a screenshot with the text blurred is
              enough.
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-subtle">
              Self-hosting? The contact address is set with{" "}
              <code className="rounded bg-surface-2 px-1 text-[10.5px]">NEXT_PUBLIC_CONTACT_EMAIL</code> in{" "}
              <code className="rounded bg-surface-2 px-1 text-[10.5px]">.env.local</code>.
            </p>
          </div>

          <div className="rounded-[9px] border border-line bg-surface p-4">
            <p className="text-[12.5px] font-semibold text-ink">Looking for help with the editor?</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-subtle">
              Shortcuts, export options and template behaviour are covered in the guides.
            </p>
            <Link href="/guides" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
              Read the guides <ArrowRight className="size-3" />
            </Link>
          </div>
        </aside>
      </div>
    </SiteShell>
  );
}
