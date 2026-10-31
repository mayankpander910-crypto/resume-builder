import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { ArticleLayout } from "@/components/content/article-list";
import { POSTS, getArticle } from "@/lib/content/articles";

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("blog", slug);
  if (!article) return { title: "Post not found" };
  return { title: article.title, description: article.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle("blog", slug);
  if (!article) notFound();
  const related = POSTS.filter((post) => post.slug !== slug).slice(0, 3);
  return (
    <SiteShell>
      <ArticleLayout article={article} base="/blog" related={related} />
    </SiteShell>
  );
}
