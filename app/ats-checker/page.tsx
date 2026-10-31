import type { Metadata } from "next";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { AtsChecker } from "@/components/ats/ats-checker";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Free ATS resume checker",
  description:
    "Run a rule-based ATS review of your resume in the browser: parseability, sections, bullet structure and keyword coverage. No account, no upload.",
};

export default function AtsCheckerPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="ATS check"
        title="Find what screening software cannot read"
        description="Eighteen structural checks on the document in your editor, eleven on pasted text — parseability, sections, bullets, dates and keyword coverage. Runs entirely in your browser."
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">Local only</Badge>
          <Badge>Rule-based</Badge>
          <Badge>Not an employer score</Badge>
        </div>
      </PageHeader>
      <AtsChecker />
    </SiteShell>
  );
}
