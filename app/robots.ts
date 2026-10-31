import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The editor and print view are per-device tools, not pages to index.
        disallow: ["/print", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
