import type { LayoutConfig, PageSettings, ThemeConfig } from "@/types/resume";

/** 96 CSS px per inch — the unit browsers use when printing, so 1px === 1/96in on paper. */
export const PX_PER_INCH = 96;
export const MM_PER_INCH = 25.4;
export const pxFromMm = (mm: number): number => (mm / MM_PER_INCH) * PX_PER_INCH;
export const pxFromPt = (pt: number): number => (pt / 72) * PX_PER_INCH;

export const PAGE_SPECS = {
  a4: { widthMm: 210, heightMm: 297, label: "A4", detail: "210 × 297 mm" },
  letter: { widthMm: 215.9, heightMm: 279.4, label: "US Letter", detail: "8.5 × 11 in" },
} as const;

export interface Pad {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ColumnBox {
  key: 0 | 1 | 2;
  /** Left offset from the page edge, in px. */
  left: number;
  /** Outer width, in px. */
  width: number;
  pad: Pad;
  /** Usable inner width, in px — the width blocks are measured at. */
  inner: number;
}

export interface PageMetrics {
  width: number;
  height: number;
  ml: number;
  mr: number;
  mt: number;
  mb: number;
  gap: number;
  contentWidth: number;
  contentHeight: number;
  columns: ColumnBox[];
  byKey: Record<0 | 1 | 2, ColumnBox | undefined>;
  /** Space between the masthead and the first column block on page 1. */
  headerGap: number;
}

const COLUMN_GAP = 20;

export const getPageMetrics = (page: PageSettings, layout: LayoutConfig): PageMetrics => {
  const spec = PAGE_SPECS[page.size] ?? PAGE_SPECS.a4;
  const width = Math.round(pxFromMm(spec.widthMm) * 100) / 100;
  const height = Math.round(pxFromMm(spec.heightMm) * 100) / 100;
  const ml = pxFromMm(page.marginLeft);
  const mr = pxFromMm(page.marginRight);
  const mt = pxFromMm(page.marginTop);
  const mb = pxFromMm(page.marginBottom);
  const contentWidth = width - ml - mr;
  const contentHeight = height - mt - mb;
  const gap = COLUMN_GAP;
  const byKey: Record<0 | 1 | 2, ColumnBox | undefined> = { 0: undefined, 1: undefined, 2: undefined };
  const columns: ColumnBox[] = [];

  const push = (box: ColumnBox) => {
    columns.push(box);
    byKey[box.key] = box;
  };

  if (layout.columns === 1) {
    push({
      key: 0,
      left: 0,
      width,
      pad: { top: mt, right: mr, bottom: mb, left: ml },
      inner: contentWidth,
    });
  } else if (layout.columns === 2) {
    const sidePct = Math.min(Math.max(layout.sidebarWidth, 20), 46) / 100;
    const sideInner = contentWidth * sidePct;
    const half = gap / 2;
    if (layout.sidebarPosition === "left") {
      const sideOuter = sideInner + half + ml;
      push({ key: 1, left: 0, width: sideOuter, pad: { top: mt, right: half, bottom: mb, left: ml }, inner: sideInner });
      push({
        key: 0,
        left: sideOuter,
        width: width - sideOuter,
        pad: { top: mt, right: mr, bottom: mb, left: half },
        inner: width - sideOuter - half - mr,
      });
    } else {
      const sideOuter = sideInner + half + mr;
      push({
        key: 0,
        left: 0,
        width: width - sideOuter,
        pad: { top: mt, right: half, bottom: mb, left: ml },
        inner: width - sideOuter - half - ml,
      });
      push({ key: 1, left: width - sideOuter, width: sideOuter, pad: { top: mt, right: mr, bottom: mb, left: half }, inner: sideInner });
    }
  } else {
    const half = gap / 2;
    const sideInner = contentWidth * 0.24;
    const centerInner = contentWidth - sideInner * 2 - gap * 2;
    const leftOuter = sideInner + half + ml;
    const rightOuter = sideInner + half + mr;
    push({ key: 1, left: 0, width: leftOuter, pad: { top: mt, right: half, bottom: mb, left: ml }, inner: sideInner });
    push({
      key: 0,
      left: leftOuter,
      width: width - leftOuter - rightOuter,
      pad: { top: mt, right: half, bottom: mb, left: half },
      inner: centerInner,
    });
    push({ key: 2, left: width - rightOuter, width: rightOuter, pad: { top: mt, right: mr, bottom: mb, left: half }, inner: sideInner });
  }

  return {
    width,
    height,
    ml,
    mr,
    mt,
    mb,
    gap,
    contentWidth,
    contentHeight,
    columns,
    byKey,
    headerGap: 8,
  };
};

/** Left-to-right render order of column keys. */
export const columnOrder = (layout: LayoutConfig): (0 | 1 | 2)[] =>
  layout.columns === 3
    ? [1, 0, 2]
    : layout.columns === 2 && layout.sidebarPosition === "left"
      ? [1, 0]
      : layout.columns === 2
        ? [0, 1]
        : [0];

/* ------------------------------------------------------------------ colours */

const hexToRgb = (hex: string): [number, number, number] | null => {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [parseInt(clean[0] + clean[0], 16), parseInt(clean[1] + clean[1], 16), parseInt(clean[2] + clean[2], 16)];
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
  }
  return null;
};

export const isDarkColor = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.42;
};

export const withAlpha = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

export const mixWithWhite = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mixed = rgb.map((v) => Math.round(v + (255 - v) * amount));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/* --------------------------------------------------------------- typography */

export const FONT_STACKS: Record<ThemeConfig["fontFamily"], string> = {
  sans: 'ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif',
  geometric: '"Avenir Next", Avenir, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  garamond: '"Palatino Linotype", Palatino, "Book Antiqua", Garamond, Georgia, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  condensed: '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
  grotesk: '"Inter", "Helvetica Neue", "Segoe UI", Arial, sans-serif',
  slab: '"Rockwell", "Roboto Slab", "Courier New", Georgia, serif',
};

export const FONT_LABELS: Record<ThemeConfig["fontFamily"], string> = {
  sans: "Helvetica / Arial",
  geometric: "Avenir / Segoe",
  serif: "Georgia",
  garamond: "Palatino / Garamond",
  mono: "Monospace",
  condensed: "Arial Narrow",
  grotesk: "Inter / Helvetica Neue",
  slab: "Rockwell slab",
};

export interface TypeScale {
  body: number;
  small: number;
  tiny: number;
  heading: number;
  name: number;
  lineHeight: number;
  sectionGap: number;
  entryGap: number;
}

export const getTypeScale = (theme: ThemeConfig): TypeScale => {
  const densityFactor = theme.density === "compact" ? 0.95 : theme.density === "relaxed" ? 1.06 : 1;
  const body = pxFromPt(10 * theme.fontScale * densityFactor);
  return {
    body,
    small: body * 0.92,
    tiny: body * 0.85,
    heading: pxFromPt(theme.headingSize * theme.fontScale),
    name: pxFromPt(theme.nameSize),
    lineHeight: theme.lineHeight,
    sectionGap: pxFromPt(theme.sectionSpacing),
    entryGap: pxFromPt(theme.sectionSpacing * 0.4),
  };
};
