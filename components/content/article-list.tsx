import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/content/types";
import { Badge } from "@/components/ui/misc";

export function ArticleCard({ article, base }: { article: Article; base: string }) {
  return (
    <Link
      href={`${base}/${article.slug}`}
      className="group flex flex-col rounded-[8px] border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-1.5">
        <Badge tone="accent">{article.category}</Badge>
        <span className="text-[11px] text-subtle">{article.readingMinutes} min read</span>
      </div>
      <h3 className="mt-2.5 text-[14.5px] font-semibold leading-snug text-ink">{article.title}</h3>
      <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-subtle">{article.excerpt}</p>
      <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent">
        Read <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}

export function ArticleLayout({
  article,
  base,
  related,
}: {
  article: Article;
  base: string;
  related: Article[];
}) {
  return (
    <article className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 max-w-[68ch]">
        <Link href={base} className="text-[12px] text-subtle hover:text-ink">
          ← {base === "/guides" ? "All guides" : "All posts"}
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="accent">{article.category}</Badge>
          <span className="text-[11.5px] text-subtle">
            {article.readingMinutes} min · updated {new Date(article.updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <h1 className="mt-2 text-[clamp(1.6rem,3.4vw,2.35rem)] leading-[1.1]">{article.title}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-subtle">{article.excerpt}</p>
        <div className="mt-5 border-t border-line pt-5">
          <ArticleBody blocks={article.blocks} />
        </div>
        <div className="mt-8 rounded-[8px] border border-line bg-surface p-4">
          <p className="text-[13px] font-semibold text-ink">Put this into practice</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-subtle">
            Open the editor and apply what you just read — the ATS checker and AI assistant are free and require no account.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Link href="/builder?new=1" className="rounded-[5px] bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-accent-hover">
              Build my resume
            </Link>
            <Link href="/ats-checker" className="rounded-[5px] border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2">
              Check my draft
            </Link>
          </div>
        </div>
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="text-eyebrow">Keep reading</p>
        <div className="mt-2 space-y-2">
          {related.map((item) => (
            <Link key={item.slug} href={`${base}/${item.slug}`} className="block rounded-[6px] border border-line bg-surface p-2.5 hover:border-line-strong">
              <p className="text-[12px] font-medium leading-snug text-ink">{item.title}</p>
              <p className="mt-0.5 text-[10.5px] text-subtle">{item.readingMinutes} min read</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 rounded-[6px] border border-line bg-surface p-2.5">
          <p className="text-[11px] font-medium text-ink">Written by</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-subtle">{article.author}. Edited for accuracy; no experience claims are invented.</p>
        </div>
      </aside>
    </article>
  );
}

import { ArticleBody } from "@/components/content/article-body";
