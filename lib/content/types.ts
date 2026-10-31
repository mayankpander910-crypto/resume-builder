export type Block =
  | { h: 2 | 3; text: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { quote: string }
  | { callout: string }
  | { table: { head: string[]; rows: string[][] } };

export interface Article {
  slug: string;
  kind: "guide" | "blog";
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  updated: string;
  author: string;
  blocks: Block[];
}
