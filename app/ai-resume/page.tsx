import type { Metadata } from "next";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { AiGenerator } from "@/components/ai/ai-generator";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "AI resume builder — free, no account",
  description:
    "Turn your real experience into a structured, ATS-readable resume. Every generated line is reviewed before it reaches your document.",
};

export default function AiResumePage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="AI assistant"
        title="Generate a first draft from facts you already have"
        description="Describe what you did in plain language. The assistant reshapes it into sections, tightens the wording and flags what is still missing — it will not invent experience."
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">No account</Badge>
          <Badge>Review before applying</Badge>
          <Badge>Works without AI too</Badge>
        </div>
      </PageHeader>
      <AiGenerator />
    </SiteShell>
  );
}
