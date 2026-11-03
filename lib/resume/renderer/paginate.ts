
/**
 * Block pagination engine.
 *
 * The renderer produces a flat list of measurable blocks per column.
 * This module distributes those blocks across pages.
 *
 * Preview, print and PDF should use the same pagination result.
 *
 * Blocks are atomic: this engine moves complete blocks between pages.
 * It does not split an individual block internally.
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
  continued: boolean;
  height: number;
}

export interface PaginatedColumn {
  pages: PlacedBlock[][];
}

export interface PaginateOptions {
  firstPageHeight: number;
  pageHeight: number;
  maxPages?: number;
}

const MIN_PAGE_HEIGHT = 80;
const DEFAULT_MAX_PAGES = 40;

function normalizeHeight(height: number): number {
  if (!Number.isFinite(height)) return 0;
  return Math.max(0, height);
}

function markContinuations(
  pages: BlockSpec[][]
): PlacedBlock[][] {
  const seenHeadings = new Set<string>();

  return pages.map((page) => {
    return page.map((block) => {
      const continued =
        block.isHead &&
        seenHeadings.has(block.sectionId);

      if (block.isHead) {
        seenHeadings.add(block.sectionId);
      }

      return {
        key: continued ? `${block.key}__cont` : block.key,
        sectionId: block.sectionId,
        isHead: block.isHead,
        continued,
        height: normalizeHeight(block.height),
      };
    });
  });
}

/**
 * Paginate a single resume column.
 */
export const paginateColumn = (
  blocks: BlockSpec[],
  options: PaginateOptions
): PaginatedColumn => {
  const maxPages = Math.max(
    1,
    Math.floor(options.maxPages ?? DEFAULT_MAX_PAGES)
  );

  const firstCapacity = Math.max(
    normalizeHeight(options.firstPageHeight),
    MIN_PAGE_HEIGHT
  );

  const nextCapacity = Math.max(
    normalizeHeight(options.pageHeight),
    MIN_PAGE_HEIGHT
  );

  if (blocks.length === 0) {
    return { pages: [[]] };
  }

  const pages: BlockSpec[][] = [];

  let currentPage: BlockSpec[] = [];
  let usedHeight = 0;
  let capacity = firstCapacity;

  const sectionHeads = new Map<string, BlockSpec>();

  for (const block of blocks) {
    if (block.isHead && !sectionHeads.has(block.sectionId)) {
      sectionHeads.set(block.sectionId, block);
    }
  }

  const pushPage = () => {
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    currentPage = [];
    usedHeight = 0;
    capacity = nextCapacity;
  };

  const addBlock = (block: BlockSpec) => {
    currentPage.push(block);
    usedHeight += normalizeHeight(block.height);
  };

  const hasHeading = (sectionId: string) => {
    return currentPage.some(
      (block) =>
        block.isHead &&
        block.sectionId === sectionId
    );
  };

  const addContinuationHeading = (sectionId: string) => {
    const heading = sectionHeads.get(sectionId);

    if (!heading || hasHeading(sectionId)) return;

    addBlock(heading);
  };

  /**
   * Move a heading to the next page when there is not
   * enough room for the heading and a reasonable portion
   * of its first content block.
   */
  const shouldMoveHeading = (
    heading: BlockSpec,
    nextBlock?: BlockSpec
  ) => {
    if (!nextBlock || currentPage.length === 0) {
      return false;
    }

    const headingHeight = normalizeHeight(heading.height);
    const nextHeight = normalizeHeight(nextBlock.height);

    const lookahead = Math.min(
      nextHeight,
      capacity * 0.5
    );

    const requiredHeight = headingHeight + lookahead;
    const remainingHeight = capacity - usedHeight;

    return requiredHeight > remainingHeight;
  };

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const blockHeight = normalizeHeight(block.height);

    // --------------------------------------------
    // SECTION HEADING
    // --------------------------------------------

    if (block.isHead) {
      const nextBlock = blocks[index + 1];

      if (shouldMoveHeading(block, nextBlock)) {
        pushPage();
      }

      if (!hasHeading(block.sectionId)) {
        addBlock(block);
      }

      continue;
    }

    // --------------------------------------------
    // NORMAL CONTENT BLOCK
    // --------------------------------------------

    const remainingHeight = capacity - usedHeight;

    if (blockHeight <= remainingHeight) {
      addBlock(block);
      continue;
    }

    // --------------------------------------------
    // BLOCK DOES NOT FIT CURRENT PAGE
    // --------------------------------------------

    if (currentPage.length > 0) {
      pushPage();

      // Repeat the heading if this section continues.
      addContinuationHeading(block.sectionId);

      /**
       * Place the block intact.
       *
       * If the repeated heading and block together exceed
       * the available height, the block may overflow.
       * The renderer must handle oversized blocks.
       */
      addBlock(block);
      continue;
    }

    // --------------------------------------------
    // EMPTY PAGE
    // --------------------------------------------

    /**
     * The block is taller than a fresh page.
     * Keep it intact rather than dropping its content.
     */
    addBlock(block);
  }

  if (currentPage.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }

  // --------------------------------------------
  // MAX PAGE GUARD
  // --------------------------------------------

  /**
   * The page limit is a safety guard, not permission
   * to discard content.
   *
   * Merge all excess pages into the final allowed page.
   * This preserves every block without duplicating the
   * previous final page.
   */
  let resultPages = pages;

  if (pages.length > maxPages) {
    const limitedPages = pages.slice(0, maxPages);

    const remainingPages = pages.slice(maxPages - 1);

    limitedPages[maxPages - 1] = remainingPages.flat();

    resultPages = limitedPages;
  }

  return {
    pages: markContinuations(resultPages),
  };
};

// ==================================================
// DOCUMENT PAGINATION
// ==================================================

export interface DocumentPagination {
  pageCount: number;
  main: PaginatedColumn;
  side: PaginatedColumn;
}

/**
 * Paginate the main and secondary columns.
 *
 * Both columns share the same page dimensions and
 * first-page header reservation.
 */
export const paginateDocument = (input: {
  main: BlockSpec[];
  side: BlockSpec[];
  headerHeight: number;
  pageHeight: number;
  headerGap?: number;
}): DocumentPagination => {
  const headerHeight = normalizeHeight(input.headerHeight);
  const headerGap = normalizeHeight(input.headerGap ?? 0);

  const pageHeight = Math.max(
    MIN_PAGE_HEIGHT,
    normalizeHeight(input.pageHeight)
  );

  const firstPageHeight = Math.max(
    pageHeight - headerHeight - headerGap,
    MIN_PAGE_HEIGHT
  );

  const main = paginateColumn(input.main, {
    firstPageHeight,
    pageHeight,
  });

  const side: PaginatedColumn = input.side.length
    ? paginateColumn(input.side, {
        firstPageHeight,
        pageHeight,
      })
    : {
        pages: [],
      };

  const pageCount = Math.max(
    main.pages.length,
    side.pages.length,
    1
  );

  return {
    pageCount,
    main,
    side,
  };
};
