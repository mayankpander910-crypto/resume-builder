import type { Metadata } from "next";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { POSTS } from "@/lib/content/articles";
import { ArticleCard } from "@/components/content/article-list";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product notes, engineering write-ups and job-search thinking from the Resume Forge project.",
};

export default function BlogPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Blog"
        title="Notes from building a document editor for resumes"
        description="Product decisions, engineering trade-offs and the occasional opinion about hiring."
      />
      <div className="container-page py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.slice(0, 1).map((post) => (
            <div key={post.slug} className="sm:col-span-2 lg:col-span-3">
              <ArticleCard article={post} base="/blog" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.slice(1).map((post) => (
            <ArticleCard key={post.slug} article={post} base="/blog" />
          ))}
        </div>
        <div className="mt-8 rounded-[8px] border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Editorial policy</Badge>
            <p className="text-[12px] text-subtle">
              Everything here is written for this project. Where a claim about a provider, a quota or a parser is made, it is documented
              as a limit rather than a promise.
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
