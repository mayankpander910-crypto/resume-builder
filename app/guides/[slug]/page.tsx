import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { ArticleLayout } from "@/components/content/article-list";
import { GUIDES, getArticle } from "@/lib/content/articles";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("guide", slug);
  if (!article) return { title: "Guide not found" };
  return { title: article.title, description: article.excerpt };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle("guide", slug);
  if (!article) notFound();
  const related = GUIDES.filter((guide) => guide.slug !== slug).slice(0, 3);
  return (
    <SiteShell>
      <ArticleLayout article={article} base="/guides" related={related} />
    </SiteShell>
  );
}
