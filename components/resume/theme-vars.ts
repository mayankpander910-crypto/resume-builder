import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/types/resume";
import type { ArchetypeDefinition } from "@/types/template";
import {
  FONT_STACKS,
  getTypeScale,
  isDarkColor,
  mixWithWhite,
  withAlpha,
} from "@/lib/resume/renderer/metrics";

export const themeVars = (
  theme: ThemeConfig,
  archetype: ArchetypeDefinition,
): CSSProperties => {
  const scale = getTypeScale(theme);

  const tracking =
    theme.headingCase === "upper"
      ? "0.09em"
      : theme.headingCase === "small-caps"
        ? "0.07em"
        : theme.headingCase === "title"
          ? "0.01em"
          : "0.015em";

  const ruleColor =
    theme.divider === "accent"
      ? withAlpha(theme.accentColor, 0.55)
      : theme.divider === "none"
        ? "transparent"
        : withAlpha(theme.textColor, 0.18);

  const headRuleWidth =
    theme.divider === "double"
      ? "3px"
      : theme.divider === "dotted"
        ? "1px"
        : theme.divider === "accent"
          ? "1.5px"
          : "1px";

  const headRuleStyle =
    theme.divider === "double"
      ? "double"
      : theme.divider === "dotted"
        ? "dotted"
        : "solid";

  const tinted = archetype.tintSidebar;
  const bandDark = isDarkColor(theme.bandColor);

  const tint = tinted ? theme.bandColor : "transparent";

  const tintText = tinted
    ? bandDark
      ? theme.bandTextColor
      : theme.textColor
    : theme.textColor;

  const tintMuted = tinted
    ? bandDark
      ? withAlpha(theme.bandTextColor, 0.74)
      : theme.mutedColor
    : theme.mutedColor;

  const tintHeading = tinted
    ? bandDark
      ? theme.bandTextColor
      : theme.accentColor
    : theme.accentColor;

  const tintRule = tinted
    ? bandDark
      ? withAlpha("#ffffff", 0.24)
      : withAlpha(theme.textColor, 0.16)
    : withAlpha(theme.textColor, 0.16);

  const accentName = [
    "modern",
    "portfolio",
    "monogram",
    "infographic",
    "grid",
    "minimal",
  ].includes(archetype.id);

  const chipBg =
    bandDark && tinted
      ? withAlpha("#ffffff", 0.16)
      : mixWithWhite(theme.accentColor, 0.9);

  const nameColor = archetype.bandHeader
    ? theme.bandTextColor
    : accentName
      ? theme.accentColor
      : theme.textColor;

  const archetypeSpacing: Record<
    string,
    { section: number; entry: number; heading: number }
  > = {
    classic: { section: 1, entry: 1, heading: 1 },
    modern: { section: 1.08, entry: 1.05, heading: 1.04 },
    sidebar: { section: 0.96, entry: 0.96, heading: 0.96 },
    "equal-split": { section: 0.95, entry: 0.94, heading: 1 },
    timeline: { section: 1.05, entry: 1.1, heading: 1.02 },
    editorial: { section: 1.16, entry: 1.12, heading: 1.08 },
    compact: { section: 0.78, entry: 0.78, heading: 0.9 },
    band: { section: 1.04, entry: 1, heading: 1 },
    grid: { section: 1.02, entry: 0.98, heading: 1.04 },
    monogram: { section: 1.08, entry: 1.04, heading: 1.05 },
    academic: { section: 1.12, entry: 1.06, heading: 1 },
    portfolio: { section: 1.08, entry: 1.06, heading: 1.04 },
    executive: { section: 1.12, entry: 1.08, heading: 1.05 },
    minimal: { section: 1.14, entry: 1.04, heading: 1.02 },
    infographic: { section: 1, entry: 0.98, heading: 1.02 },
    columnar: { section: 0.98, entry: 0.96, heading: 1 },
  };

  const spacing = archetypeSpacing[archetype.id] ?? archetypeSpacing.classic;

  const headingStyle = archetype.headingStyle;

  const headingWeight =
    archetype.id === "editorial" || archetype.id === "academic"
      ? 650
      : 750;

  const nameTracking =
    archetype.id === "editorial"
      ? "-0.045em"
      : archetype.id === "executive"
        ? "-0.025em"
        : "-0.035em";

  const nameWeight =
    archetype.id === "minimal" || archetype.id === "academic"
      ? 650
      : 750;

  const headingRule =
    archetype.id === "editorial" || archetype.id === "academic"
      ? withAlpha(theme.textColor, 0.3)
      : withAlpha(theme.accentColor, 0.7);

  return {
    "--rp-font": FONT_STACKS[theme.fontFamily],
    "--rp-headfont": FONT_STACKS[theme.headingFontFamily],

    "--rp-body": `${scale.body}px`,
    "--rp-small": `${scale.small}px`,
    "--rp-tiny": `${scale.tiny}px`,
    "--rp-heading": `${scale.heading * spacing.heading}px`,
    "--rp-name": `${scale.name}px`,
    "--rp-lh": String(scale.lineHeight),

    "--rp-sec-gap": `${scale.sectionGap * spacing.section}px`,
    "--rp-entry-gap": `${scale.entryGap * spacing.entry}px`,

    "--rp-text": theme.textColor,
    "--rp-accent": theme.accentColor,
    "--rp-muted": theme.mutedColor,

    "--rp-title-color": theme.textColor,
    "--rp-heading-color": theme.accentColor,
    "--rp-heading-rule": headingRule,
    "--rp-heading-fill": chipBg,
    "--rp-heading-tracking": tracking,
    "--rp-heading-transform":
      theme.headingCase === "upper"
        ? "uppercase"
        : theme.headingCase === "small-caps"
          ? "lowercase"
          : "none",
    "--rp-heading-variant":
      theme.headingCase === "small-caps" ? "small-caps" : "normal",
    "--rp-heading-gap": `${Math.max(scale.body * 0.34, 3)}px`,

    "--rp-name-color": nameColor,
    "--rp-name-weight": String(nameWeight),
    "--rp-name-tracking": nameTracking,
    "--rp-heading-weight": String(headingWeight),

    "--rp-rule-color": ruleColor,
    "--rp-rule-width": "1px",
    "--rp-head-rule-width": headRuleWidth,
    "--rp-head-rule-style": headRuleStyle,

    "--rp-bullet-color":
      theme.bulletStyle === "none"
        ? "transparent"
        : withAlpha(theme.accentColor, 0.9),

    "--rp-band": theme.bandColor,
    "--rp-band-text": theme.bandTextColor,
    "--rp-band-muted": withAlpha(theme.bandTextColor, 0.8),

    "--rp-tint": tint,
    "--rp-tint-text": tintText,
    "--rp-tint-muted": tintMuted,
    "--rp-tint-heading": tintHeading,
    "--rp-tint-rule": tintRule,
    "--rp-tint-accent":
      tinted && bandDark ? theme.bandTextColor : theme.accentColor,

    "--rp-chip-bg": chipBg,
    "--rp-chip-border": withAlpha(theme.accentColor, 0.28),
    "--rp-chip-text":
      tinted && bandDark ? theme.bandTextColor : theme.textColor,

    "--rp-heading-style": headingStyle,
  } as CSSProperties;
};

export const headingClass = (
  theme: ThemeConfig,
  strong: boolean,
): string => `rp-h--${theme.headingStyle}${strong ? " is-strong" : ""}`;

export const headingTransform = (
  theme: ThemeConfig,
): CSSProperties["textTransform"] =>
  theme.headingCase === "upper"
    ? "uppercase"
    : theme.headingCase === "small-caps"
      ? "lowercase"
      : "none";

export const headingFontVariant = (
  theme: ThemeConfig,
): CSSProperties["fontVariant"] =>
  theme.headingCase === "small-caps" ? "small-caps" : "normal";