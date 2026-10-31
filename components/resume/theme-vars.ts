import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/types/resume";
import type { ArchetypeDefinition } from "@/types/template";
import { FONT_STACKS, getTypeScale, isDarkColor, mixWithWhite, withAlpha } from "@/lib/resume/renderer/metrics";

/**
 * Maps theme tokens onto the CSS custom properties consumed by resume.css.
 * Keeping this in one place means the editor canvas and the printed PDF can
 * never drift apart.
 */
export const themeVars = (theme: ThemeConfig, archetype: ArchetypeDefinition): CSSProperties => {
  const scale = getTypeScale(theme);
  const tracking =
    theme.headingCase === "upper" ? "0.09em" : theme.headingCase === "small-caps" ? "0.07em" : theme.headingCase === "title" ? "0.01em" : "0.015em";

  const ruleColor =
    theme.divider === "accent"
      ? withAlpha(theme.accentColor, 0.55)
      : theme.divider === "none"
        ? "transparent"
        : withAlpha(theme.textColor, 0.18);

  const headRuleWidth =
    theme.divider === "double" ? "3px" : theme.divider === "dotted" ? "1px" : theme.divider === "accent" ? "1.5px" : "1px";
  const headRuleStyle = theme.divider === "double" ? "double" : theme.divider === "dotted" ? "dotted" : "solid";

  const tinted = archetype.tintSidebar;
  const bandDark = isDarkColor(theme.bandColor);
  const tint = tinted ? theme.bandColor : "transparent";
  const tintText = tinted ? (bandDark ? theme.bandTextColor : theme.textColor) : theme.textColor;
  const tintMuted = tinted ? (bandDark ? withAlpha(theme.bandTextColor, 0.74) : theme.mutedColor) : theme.mutedColor;
  const tintHeading = tinted ? (bandDark ? theme.bandTextColor : theme.accentColor) : theme.accentColor;
  const tintRule = tinted ? (bandDark ? withAlpha("#ffffff", 0.24) : withAlpha(theme.textColor, 0.16)) : withAlpha(theme.textColor, 0.16);

  const accentName = ["modern", "portfolio", "monogram", "infographic", "grid", "minimal"].includes(archetype.id);
  const chipBg = isDarkColor(theme.bandColor) && tinted ? withAlpha("#ffffff", 0.16) : mixWithWhite(theme.accentColor, 0.9);

  const nameColor = archetype.bandHeader ? theme.bandTextColor : accentName ? theme.accentColor : theme.textColor;

  return {
    "--rp-font": FONT_STACKS[theme.fontFamily],
    "--rp-headfont": FONT_STACKS[theme.headingFontFamily],
    "--rp-body": `${scale.body}px`,
    "--rp-small": `${scale.small}px`,
    "--rp-tiny": `${scale.tiny}px`,
    "--rp-heading": `${scale.heading}px`,
    "--rp-name": `${scale.name}px`,
    "--rp-lh": String(scale.lineHeight),
    "--rp-sec-gap": `${scale.sectionGap}px`,
    "--rp-entry-gap": `${scale.entryGap}px`,
    "--rp-text": theme.textColor,
    "--rp-accent": theme.accentColor,
    "--rp-muted": theme.mutedColor,
    "--rp-title-color": theme.textColor,
    "--rp-heading-color": theme.accentColor,
    "--rp-heading-rule": withAlpha(theme.accentColor, 0.7),
    "--rp-heading-fill": chipBg,
    "--rp-heading-tracking": tracking,
    "--rp-heading-transform": theme.headingCase === "upper" ? "uppercase" : theme.headingCase === "small-caps" ? "lowercase" : "none",
    "--rp-heading-variant": theme.headingCase === "small-caps" ? "small-caps" : "normal",
    "--rp-heading-gap": `${Math.max(scale.body * 0.34, 3)}px`,
    "--rp-name-color": nameColor,
    "--rp-rule-color": ruleColor,
    "--rp-rule-width": "1px",
    "--rp-head-rule-width": headRuleWidth,
    "--rp-head-rule-style": headRuleStyle,
    "--rp-bullet-color": theme.bulletStyle === "none" ? "transparent" : withAlpha(theme.accentColor, 0.9),
    "--rp-band": theme.bandColor,
    "--rp-band-text": theme.bandTextColor,
    "--rp-band-muted": withAlpha(theme.bandTextColor, 0.8),
    "--rp-tint": tint,
    "--rp-tint-text": tintText,
    "--rp-tint-muted": tintMuted,
    "--rp-tint-heading": tintHeading,
    "--rp-tint-rule": tintRule,
    "--rp-tint-accent": tinted && bandDark ? theme.bandTextColor : theme.accentColor,
    "--rp-chip-bg": chipBg,
    "--rp-chip-border": withAlpha(theme.accentColor, 0.28),
    "--rp-chip-text": tinted && bandDark ? theme.bandTextColor : theme.textColor,
  } as CSSProperties;
};

export const headingClass = (theme: ThemeConfig, strong: boolean): string =>
  `rp-h--${theme.headingStyle}${strong ? " is-strong" : ""}`;

export const headingTransform = (theme: ThemeConfig): CSSProperties["textTransform"] =>
  theme.headingCase === "upper" ? "uppercase" : theme.headingCase === "small-caps" ? "lowercase" : "none";

export const headingFontVariant = (theme: ThemeConfig): CSSProperties["fontVariant"] =>
  theme.headingCase === "small-caps" ? "small-caps" : "normal";
