import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Plain-language terms for using Resume Forge: what you own, what is provided as-is, and the limits of the ATS review.",
};

const UPDATED = "31 October 2026";

export default function TermsPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Terms"
        title="Terms of use, without the theatre"
        description="You keep everything you write. The tool is provided as-is, free, with no guarantee of an interview. The ATS review is a checklist, not a prediction."
      >
        <Badge>Last updated {UPDATED}</Badge>
      </PageHeader>

      <article className="container-page prose-page max-w-[72ch] py-10">
        <h2>1. Using the service</h2>
        <p>
          Resume Forge is a free tool for creating resumes. You may use it for personal or commercial purposes, including writing resumes on
          behalf of others. You may not use it to create content that is knowingly false about a person&apos;s qualifications, or to attack,
          overload or probe the deployment.
        </p>

        <h2>2. Your content</h2>
        <p>
          Everything you write belongs to you. Because the document is stored in your browser, we hold no copy and claim no licence over it.
          You are responsible for keeping your own backups — export a PDF or the JSON document copy if you need one.
        </p>

        <h2>3. AI features</h2>
        <p>
          The optional assistant forwards the text you submit to a third-party model provider. Output can be wrong, repetitive or subtly
          inaccurate. You are responsible for reviewing every line before using the resume, and for the factual accuracy of anything you
          submit. Do not submit confidential material belonging to an employer without permission.
        </p>

        <h2>4. No employment outcome</h2>
        <p>
          Nothing here guarantees an interview, an offer, or a particular result from any applicant tracking system. The ATS review is a
          rule-based heuristic written for this project; it does not reproduce any vendor&apos;s ranking and makes no claim to.
        </p>

        <h2>5. Availability and changes</h2>
        <p>
          The tool is provided as-is, without warranties of any kind. Features may change or be removed. If a change would affect how your
          data is handled, the privacy page will describe it before it ships.
        </p>

        <h2>6. Liability</h2>
        <p>
          To the extent permitted by law, the operators of this deployment are not liable for indirect or consequential loss arising from use
          of the tool, including lost data caused by clearing browser storage, or outcomes of job applications made with documents created
          here.
        </p>

        <h2>7. Self-hosting</h2>
        <p>
          The project can be run on your own infrastructure. In that case the operator of that deployment is responsible for its configuration,
          its provider keys and its own compliance obligations.
        </p>

        <p className="!mt-8 text-[12.5px] text-subtle">
          See also the <Link href="/privacy">privacy page</Link> and the <Link href="/contact">contact page</Link>.
        </p>
      </article>
    </SiteShell>
  );
}
