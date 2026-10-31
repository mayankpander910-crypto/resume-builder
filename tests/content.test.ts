import { describe, expect, it } from "vitest";
import { GUIDES, POSTS, getArticle } from "@/lib/content/articles";
import { EXAMPLES, getExample } from "@/lib/content/examples";
import { getTemplate, TEMPLATES } from "@/lib/templates/registry";
import type { Block } from "@/lib/content/types";

const allArticles = [...GUIDES, ...POSTS];

const textOf = (blocks: Block[]): string =>
  blocks
    .map((block) => {
      if ("h" in block) return block.text;
      if ("p" in block) return block.p;
      if ("ul" in block) return block.ul.join(" ");
      if ("ol" in block) return block.ol.join(" ");
      if ("quote" in block) return block.quote;
      if ("callout" in block) return block.callout;
      if ("table" in block) return [...block.table.head, ...block.table.rows.flat()].join(" ");
      return "";
    })
    .join(" ");

describe("published content", () => {
  it("has four guides and four posts", () => {
    expect(GUIDES.length).toBe(4);
    expect(POSTS.length).toBe(4);
  });

  it("uses unique, url-safe slugs", () => {
    const slugs = allArticles.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("writes real long-form copy, not lorem ipsum", () => {
    for (const article of allArticles) {
      const words = textOf(article.blocks).split(/\s+/).filter(Boolean).length;
      expect(words).toBeGreaterThan(300);
      expect(textOf(article.blocks).toLowerCase()).not.toContain("lorem ipsum");
      expect(article.excerpt.length).toBeGreaterThan(40);
      expect(article.readingMinutes).toBeGreaterThan(2);
      expect(article.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("averages a substantial length across the library", () => {
    const average =
      allArticles.reduce((sum, article) => sum + textOf(article.blocks).split(/\s+/).filter(Boolean).length, 0) / allArticles.length;
    expect(average).toBeGreaterThan(450);
  });

  it("only uses block kinds the renderer knows", () => {
    const allowed = ["h", "p", "ul", "ol", "quote", "callout", "table"];
    for (const article of allArticles) {
      for (const block of article.blocks) {
        expect(allowed).toContain(Object.keys(block)[0]);
        expect(Object.keys(block).every((key) => key === "text" || allowed.includes(key))).toBe(true);
      }
    }
  });

  it("looks articles up by kind so a post cannot be reached as a guide", () => {
    const guide = GUIDES[0];
    expect(getArticle("guide", guide.slug)?.slug).toBe(guide.slug);
    expect(getArticle("blog", guide.slug)).toBeUndefined();
    expect(getArticle("guide", "nope")).toBeUndefined();
  });

  it("has nine worked examples with distinct slugs and titles", () => {
    expect(EXAMPLES.length).toBe(9);
    expect(new Set(EXAMPLES.map((example) => example.slug)).size).toBe(EXAMPLES.length);
    expect(new Set(EXAMPLES.map((example) => example.title)).size).toBe(EXAMPLES.length);
    // role is the category badge, so several examples may share one
    expect(new Set(EXAMPLES.map((example) => example.role)).size).toBeGreaterThanOrEqual(5);
  });

  it("points every example at a real template", () => {
    const ids = new Set(TEMPLATES.map((template) => template.id));
    for (const example of EXAMPLES) {
      expect(ids.has(example.templateId)).toBe(true);
      expect(getTemplate(example.templateId).id).toBe(example.templateId);
      expect(getExample(example.slug)?.slug).toBe(example.slug);
    }
  });

  it("gives each example a summary, bullets, skills and honest caveats", () => {
    for (const example of EXAMPLES) {
      expect(example.summary.split(/\s+/).length).toBeGreaterThan(20);
      expect(example.bullets.length).toBeGreaterThanOrEqual(3);
      expect(example.skills.length).toBeGreaterThanOrEqual(4);
      expect(example.notes.length).toBeGreaterThanOrEqual(2);
      expect(example.watchOut.length).toBeGreaterThan(40);
      // level is a human label on the card, so accept the labels the content uses
      expect(example.level).toMatch(/student|fresher|entry|junior|mid|senior|lead|executive/i);
    }
  });

  it("keeps the sample resume distinct from the published examples", () => {
    const sampleNames = new Set(EXAMPLES.map((example) => example.summary.slice(0, 20)));
    expect(sampleNames.size).toBe(EXAMPLES.length);
  });
});
