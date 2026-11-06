
import { Fragment, type ReactNode } from "react";
import type { ResumeDocument, ResumeSection } from "@/types/resume";
import type { ArchetypeDefinition } from "@/types/template";
import { sectionHasContent } from "@/lib/resume/schema/factory";
import { headingClass } from "@/components/resume/theme-vars";
import {
  sectionBody,
  sectionItemKeys,
  sectionItems,
  SectionTitle,
} from "@/components/resume/parts";

export interface BlockNode {
  key: string;
  sectionId: string;
  isHead: boolean;
  node: ReactNode;
}

/**
 * All blocks belonging to one section, combined into one renderable unit.
 *
 * Flow mode uses individual BlockNode objects for pagination.
 * Free positioning uses SectionBlockGroup objects so an entire section
 * can be moved as one canvas element.
 */
export interface SectionBlockGroup {
  key: string;
  sectionId: string;
  blocks: BlockNode[];
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
 *
 * One head block per section and one block per item allow long sections
 * to flow across page boundaries without losing their heading.
 *
 * Do not combine these blocks here: the pagination engine depends on
 * their individual measurements.
 */
export const buildColumnBlocks = (
  doc: ResumeDocument,
  options: BuildOptions
): Record<0 | 1 | 2, BlockNode[]> => {
  const result: Record<0 | 1 | 2, BlockNode[]> = {
    0: [],
    1: [],
    2: [],
  };

  const { showEmpty = false, archetype } = options;

  for (const section of doc.sections) {
    if (!section.visible) continue;

    const column = (section.column ?? 0) as 0 | 1 | 2;

    if (doc.layout.columns === 1 && column !== 0) {
      continue;
    }

    const hasContent = sectionHasContent(section);

    if (!hasContent && !showEmpty) {
      continue;
    }

    if (!section.hideTitle) {
      result[column].push({
        key: `head:${section.id}`,
        sectionId: section.id,
        isHead: true,
        node: (
          <div
            className={`rp-sec ${headingClass(
              doc.theme,
              archetype.id === "classic" ||
                archetype.id === "executive"
            )} rp-block`}
          >
            <SectionTitle
              title={section.title || "Section"}
              sectionId={section.id}
            />
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

/**
 * Groups individual pagination blocks by section.
 *
 * The original block order is preserved. This means headings remain
 * before their entries, and entries remain in their original order.
 *
 * Each resulting group can be positioned and dragged as one unit
 * without changing the existing pagination data.
 */
export const groupBlocksBySection = (
  blocks: BlockNode[]
): SectionBlockGroup[] => {
  const groups: SectionBlockGroup[] = [];
  const groupById = new Map<string, SectionBlockGroup>();

  for (const block of blocks) {
    let group = groupById.get(block.sectionId);

    if (!group) {
      group = {
        key: `section:${block.sectionId}`,
        sectionId: block.sectionId,
        blocks: [],
        node: null,
      };

      groupById.set(block.sectionId, group);
      groups.push(group);
    }

    group.blocks.push(block);
  }

  return groups.map((group) => ({
    ...group,
    node: (
      <Fragment>
        {group.blocks.map((block) => (
          <Fragment key={block.key}>{block.node}</Fragment>
        ))}
      </Fragment>
    ),
  }));
};

/**
 * Groups all three columns into independently renderable section groups.
 */
export const groupColumnBlocks = (
  blocks: Record<0 | 1 | 2, BlockNode[]>
): Record<0 | 1 | 2, SectionBlockGroup[]> => ({
  0: groupBlocksBySection(blocks[0]),
  1: groupBlocksBySection(blocks[1]),
  2: groupBlocksBySection(blocks[2]),
});

/**
 * The key of the first rendered block for a section.
 * Used by the canvas drag handle.
 */
export const firstBlockKey = (
  section: ResumeSection,
  columns: number
): string => {
  if (columns === 1 && section.column !== 0) {
    return "";
  }

  if (!section.hideTitle) {
    return `head:${section.id}`;
  }

  const body = sectionBody(section, {} as never);

  if (!body.splitPerItem) {
    return `body:${section.id}`;
  }

  const keys = sectionItemKeys(section);

  return keys.length
    ? `item:${section.id}:${keys[0]}`
    : `body:${section.id}`;
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

/**
 * Renders the raw block list (no pagination).
 * Used for thumbnails and previews.
 */
export const BlockList = ({
  blocks,
  firstIsFlat,
}: {
  blocks: BlockNode[];
  firstIsFlat?: boolean;
}) => (
  <div
    className="rp-col"
    data-first-flat={firstIsFlat ? "1" : undefined}
  >
    {blocks.map((block) => (
      <div key={block.key} data-block-key={block.key}>
        {block.node}
      </div>
    ))}
  </div>
);
