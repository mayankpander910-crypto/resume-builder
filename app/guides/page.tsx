import type { Metadata } from "next";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { GUIDES } from "@/lib/content/articles";
import { ArticleCard } from "@/components/content/article-list";

export const metadata: Metadata = {
  title: "Career and resume guides",
  description: "Practical guides on resume structure, achievement bullets, ATS parsing and career changes.",
};

export default function GuidesPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Guides"
        title="Practical guidance, written to be used"
        description="No listicles. Each guide is a procedure you can apply to your own draft in the next twenty minutes."
      />
      <div className="container-page grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDES.map((guide) => (
          <ArticleCard key={guide.slug} article={guide} base="/guides" />
        ))}
      </div>
    </SiteShell>
  );
}
