import type { ReactNode } from "react";
import type { ResumeDocument, ResumeSection } from "@/types/resume";
import type { ArchetypeDefinition } from "@/types/template";
import { sectionHasContent } from "@/lib/resume/schema/factory";
import { headingClass } from "@/components/resume/theme-vars";
import { sectionBody, sectionItemKeys, sectionItems, SectionTitle } from "@/components/resume/parts";

export interface BlockNode {
  key: string;
  sectionId: string;
  isHead: boolean;
  node: ReactNode;
}

export interface BuildOptions {
  /** Show sections that have no content yet (used by the editor canvas). */
  showEmpty?: boolean;
  archetype: ArchetypeDefinition;
}

const EmptyHint = ({ label }: { label: string }) => (
  <div className="rp-empty" style={{ paddingTop: 2 }}>
    {label}
  </div>
);

/**
 * Splits a resume into measurable, page-breakable blocks per column.
 * One head block per section, one block per item, so long sections can flow
 * across page boundaries without losing their heading.
 */
export const buildColumnBlocks = (doc: ResumeDocument, options: BuildOptions): Record<0 | 1 | 2, BlockNode[]> => {
  const result: Record<0 | 1 | 2, BlockNode[]> = { 0: [], 1: [], 2: [] };
  const { showEmpty = false, archetype } = options;

  for (const section of doc.sections) {
    if (!section.visible) continue;
    const column = (section.column ?? 0) as 0 | 1 | 2;
    if (doc.layout.columns === 1 && column !== 0) continue;
    const hasContent = sectionHasContent(section);

    if (!hasContent && !showEmpty) continue;

    if (!section.hideTitle) {
      result[column].push({
        key: `head:${section.id}`,
        sectionId: section.id,
        isHead: true,
        node: (
          <div className={`rp-sec ${headingClass(doc.theme, archetype.id === "classic" || archetype.id === "executive")} rp-block`}>
            <SectionTitle title={section.title || "Section"} />
          </div>
        ),
      });
    }

    const body = sectionBody(section, doc.theme);
    if (!body.splitPerItem) {
      result[column].push({
        key: `body:${section.id}`,
        sectionId: section.id,
        isHead: false,
        node: body.node ? (
          <div className="rp-block">{body.node}</div>
        ) : (
          <div className="rp-block">
            <EmptyHint label={emptyHintFor(section)} />
          </div>
        ),
      });
      continue;
    }

    const items = sectionItems(section, doc.theme);
    const keys = sectionItemKeys(section);
    if (items.length === 0) {
      result[column].push({
        key: `body:${section.id}`,
        sectionId: section.id,
        isHead: false,
        node: (
          <div className="rp-block">
            <EmptyHint label={emptyHintFor(section)} />
          </div>
        ),
      });
      continue;
    }
    items.forEach((node, index) => {
      result[column].push({
        key: `item:${section.id}:${keys[index] ?? index}`,
        sectionId: section.id,
        isHead: false,
        node: <div className="rp-block">{node}</div>,
      });
    });
  }

  return result;
};

/** The key of the first rendered block for a section — used by the canvas drag handle. */
export const firstBlockKey = (section: ResumeSection, columns: number): string => {
  if (columns === 1 && section.column !== 0) return "";
  if (!section.hideTitle) return `head:${section.id}`;
  const body = sectionBody(section, {} as never);
  if (!body.splitPerItem) return `body:${section.id}`;
  const keys = sectionItemKeys(section);
  return keys.length ? `item:${section.id}:${keys[0]}` : `body:${section.id}`;
};

const emptyHintFor = (section: ResumeSection): string => {
  switch (section.kind) {
    case "summary":
      return "Write a two-to-four line professional summary.";
    case "skills":
      return "Add the skills you want to be interviewed about.";
    case "languages":
      return "Add languages and proficiency levels.";
    case "interests":
      return "Optional — a short line of genuine interests.";
    default:
      return "This section is empty. Add an entry to make it appear in the PDF.";
  }
};

/** Renders the raw block list (no pagination) — used for thumbnails and previews. */
export const BlockList = ({ blocks, firstIsFlat }: { blocks: BlockNode[]; firstIsFlat?: boolean }) => (
  <div className="rp-col" data-first-flat={firstIsFlat ? "1" : undefined}>
    {blocks.map((block) => (
      <div key={block.key} data-block-key={block.key}>
        {block.node}
      </div>
    ))}
  </div>
);
