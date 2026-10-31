export const formatRange = (start: string, end: string, current?: boolean): string => {
  const s = start?.trim() ?? "";
  const e = current ? "Present" : (end?.trim() ?? "");
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
};

export const normalizeUrl = (raw: string): string => {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
};

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const joinNonEmpty = (values: (string | undefined | null)[], separator = " · "): string =>
  values.filter((v): v is string => Boolean(v && v.trim())).join(separator);

/** Accepts "3+ years", "Fluent", "Native" etc. and returns 0-5 for dot rendering. */
export const proficiencyDots = (value: string): number => {
  const v = value.toLowerCase();
  if (/native|mother/.test(v)) return 5;
  if (/fluent|full professional/.test(v)) return 4;
  if (/professional|advanced|proficient/.test(v)) return 4;
  if (/intermediate|conversational|working/.test(v)) return 3;
  if (/basic|beginner|elementary/.test(v)) return 2;
  const numeric = v.match(/(\d)\s*\/\s*5/);
  if (numeric) return Math.max(1, Math.min(5, Number(numeric[1])));
  return 3;
};

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
