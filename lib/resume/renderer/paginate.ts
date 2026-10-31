/**
 * Block pagination.
 *
 * The renderer emits a flat list of measurable blocks per column. This pure
 * function decides which blocks land on which page, so preview, print and PDF
 * are three views of one layout decision. Heights are supplied by the caller
 * (measured in the browser; synthetic in tests).
 */

export interface BlockSpec {
  key: string;
  sectionId: string;
  isHead: boolean;
  height: number;
}

export interface PlacedBlock {
  key: string;
  sectionId: string;
  isHead: boolean;
  /** True when the head was re-emitted at the top of a continuation page. */
  continued: boolean;
  height: number;
}

export interface PaginatedColumn {
  /** One entry per page, in page order. */
  pages: PlacedBlock[][];
}

export interface PaginateOptions {
  /** Height available on the first page after the header has been laid out. */
  firstPageHeight: number;
  /** Height available on every subsequent page. */
  pageHeight: number;
  /** Guard against pathological input. */
  maxPages?: number;
}

/**
 * Paginate one column. A section head is never left alone at the bottom of a
 * page (it carries a look-ahead for its first block), and a section that
 * continues onto a new page re-emits its head as a continuation marker so the
 * reader always knows which section they are in.
 */
export const paginateColumn = (blocks: BlockSpec[], options: PaginateOptions): PaginatedColumn => {
  const { firstPageHeight, pageHeight } = options;
  const maxPages = options.maxPages ?? 40;
  const usable: BlockSpec[][] = [];
  let current: BlockSpec[] = [];
  let used = 0;
  let capacity = Math.max(firstPageHeight, 80);

  const heads = new Map<string, BlockSpec>();
  for (const block of blocks) {
    if (block.isHead && !heads.has(block.sectionId)) heads.set(block.sectionId, block);
  }

  const pushPage = () => {
    usable.push(current);
    current = [];
    used = 0;
    capacity = Math.max(pageHeight, 80);
  };

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (block.isHead) {
      const next = blocks[i + 1];
      const lookahead = next ? next.height : 0;
      const needed = block.height + Math.min(lookahead, capacity * 0.5);
      if (used > 0 && used + needed > capacity) {
        pushPage();
      }
      current.push(block);
      used += block.height;
      continue;
    }

    if (used + block.height > capacity) {
      const fitsAlone = block.height <= capacity;
      if (used > 0 && fitsAlone) {
        pushPage();
        const head = heads.get(block.sectionId);
        if (head) {
          current.push({ ...head });
          used += head.height;
        }
      } else if (used === 0 && !fitsAlone) {
        // A single block taller than a page: place it and let it clip rather
        // than loop forever. Rare in practice (one job = >1 page of bullets).
        current.push(block);
        used += block.height;
        continue;
      }
    }

    current.push(block);
    used += block.height;

    if (usable.length >= maxPages) break;
  }

  if (current.length > 0 || usable.length === 0) usable.push(current);

  // Convert to placed blocks, marking re-emitted heads as continuations.
  const seenHead = new Set<string>();
  const pages = usable.map((pageBlocks) => {
    const placed: PlacedBlock[] = [];
    let previousSection: string | null = null;
    for (const block of pageBlocks) {
      const isContinuation = block.isHead && seenHead.has(block.sectionId);
      if (block.isHead) seenHead.add(block.sectionId);
      placed.push({
        key: isContinuation ? `${block.key}__cont` : block.key,
        sectionId: block.sectionId,
        isHead: block.isHead,
        continued: isContinuation,
        height: block.height,
      });
      previousSection = block.sectionId;
    }
    void previousSection;
    return placed;
  });

  return { pages };
};

export interface DocumentPagination {
  pageCount: number;
  main: PaginatedColumn;
  side: PaginatedColumn;
}

export const paginateDocument = (input: {
  main: BlockSpec[];
  side: BlockSpec[];
  headerHeight: number;
  pageHeight: number;
  /** Extra breathing room between the header and the first column block. */
  headerGap?: number;
}): DocumentPagination => {
  const gap = input.headerGap ?? 0;
  const firstCap = Math.max(input.pageHeight - input.headerHeight - gap, 80);
  const main = paginateColumn(input.main, { firstPageHeight: firstCap, pageHeight: input.pageHeight });
  const side = input.side.length
    ? paginateColumn(input.side, { firstPageHeight: firstCap, pageHeight: input.pageHeight })
    : { pages: [] as PlacedBlock[][] };
  const pageCount = Math.max(main.pages.length, side.pages.length, 1);
  return { pageCount, main, side };
};
