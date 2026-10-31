import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/lib/templates/registry";
import { EXAMPLES } from "@/lib/content/examples";
import { GUIDES, POSTS } from "@/lib/content/articles";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/builder", priority: 0.9, changeFrequency: "weekly" },
    { path: "/templates", priority: 0.9, changeFrequency: "weekly" },
    { path: "/ai-resume", priority: 0.8, changeFrequency: "monthly" },
    { path: "/ats-checker", priority: 0.8, changeFrequency: "monthly" },
    { path: "/import", priority: 0.7, changeFrequency: "monthly" },
    { path: "/examples", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guides", priority: 0.7, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...TEMPLATES.map((template) => ({
      url: `${BASE}/templates/${template.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...EXAMPLES.map((example) => ({
      url: `${BASE}/examples/${example.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...GUIDES.map((guide) => ({
      url: `${BASE}/guides/${guide.slug}`,
      lastModified: new Date(guide.updated),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...POSTS.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.updated),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
