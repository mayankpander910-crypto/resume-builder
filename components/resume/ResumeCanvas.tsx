"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import type { ResumeDocument } from "@/types/resume";
import type { ResumeTemplate } from "@/types/template";

import { archetypeOf } from "@/lib/templates/archetypes";

import {
  columnOrder,
  getPageMetrics,
  type ColumnBox,
  type PageMetrics,
} from "@/lib/resume/renderer/metrics";

import {
  paginateDocument,
  type PlacedBlock,
} from "@/lib/resume/renderer/paginate";

import {
  buildColumnBlocks,
  type BlockNode,
} from "@/components/resume/blocks";

import {
  ResumeHeader,
  SectionTitle,
} from "@/components/resume/parts";

import {
  themeVars,
  headingClass,
} from "@/components/resume/theme-vars";
import { useInlineEditor } from "@/components/editor/InlineEditable";

export interface ResumeCanvasProps {
  doc: ResumeDocument;
  template: ResumeTemplate;
  mode?: "paged" | "flow";
  showEmpty?: boolean;
  zoom?: number;
  className?: string;
  renderBlockOverlay?: (blockKey: string) => ReactNode;
  onPageCount?: (count: number) => void;
  onInitializePositions?: (
    positions: { id: string; position: { page: number; x: number; y: number } }[],
  ) => void;
  printable?: boolean;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const MM_TO_PX = 96 / 25.4;

const mmToPx = (value: number) => value * MM_TO_PX;
const pxToMm = (value: number) => value / MM_TO_PX;

interface Measured {
  heights: Record<string, number>;
  headerHeight: number;
  signature: string;
}

interface FreeSection {
  id: string;
  column: 0 | 1 | 2;
  blocks: BlockNode[];
  x: number;
  y: number;
  page: number;
  width: number;
  zIndex: number;
  locked: boolean;
}

const FALLBACK_HEADER_HEIGHT = 96;

export function ResumeCanvas({
  doc,
  template,
  mode = "paged",
  showEmpty = false,
  zoom = 1,
  className,
  renderBlockOverlay,
  onPageCount,
  onInitializePositions,
  printable,
}: ResumeCanvasProps) {
  // --------------------------------------------------
  // DOCUMENT CONFIGURATION
  // --------------------------------------------------

  const archetype = archetypeOf(template.archetype);
  const editor = useInlineEditor();

  const metrics = useMemo(
    () => getPageMetrics(doc.page, doc.layout),
    [doc.page, doc.layout],
  );

  const vars = useMemo(
    () => themeVars(doc.theme, archetype),
    [doc.theme, archetype],
  );

  const blocks = useMemo(
    () => buildColumnBlocks(doc, { showEmpty, archetype }),
    [doc, showEmpty, archetype],
  );

  const order = columnOrder(doc.layout);

  const isFreePositionMode =
    doc.layout.positioningMode === "free";

  // --------------------------------------------------
  // MEASUREMENT
  // --------------------------------------------------

  const measureRef = useRef<HTMLDivElement | null>(null);

  const [measured, setMeasured] = useState<Measured | null>(null);

  const signature = useMemo(
    () =>
      JSON.stringify([
        doc,
        mode,
        showEmpty,
      ]),
    [doc, mode, showEmpty],
  );

  const measure = useCallback(() => {
    const host = measureRef.current;

    if (!host) return;

    const heights: Record<string, number> = {};

    host.querySelectorAll<HTMLElement>("[data-mkey]").forEach(
      (node) => {
        const key = node.dataset.mkey;

        if (!key || key === "__header") return;

        heights[key] = node.getBoundingClientRect().height;
      },
    );

    const headerNode = host.querySelector<HTMLElement>(
      '[data-mkey="__header"]',
    );

    const headerHeight =
      headerNode?.getBoundingClientRect().height ??
      FALLBACK_HEADER_HEIGHT;

    setMeasured({
      heights,
      headerHeight,
      signature,
    });
  }, [signature]);

  useIsomorphicLayoutEffect(() => {
    if (mode !== "paged") return;

    measure();
  }, [measure, mode]);

  useEffect(() => {
    if (mode !== "paged") return;

    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      if (!cancelled) measure();
    });

    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [measure, mode]);

  const fresh = measured;

  // --------------------------------------------------
  // BLOCK HEIGHTS
  // --------------------------------------------------

  const withHeights = useCallback(
    (list: BlockNode[]) =>
      list.map((block) => ({
        key: block.key,
        sectionId: block.sectionId,
        isHead: block.isHead,
        height: fresh?.heights[block.key] ?? 0,
      })),
    [fresh],
  );

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const pagination = useMemo(() => {
    if (mode !== "paged" || !fresh) {
      return null;
    }

    const mainList = withHeights(blocks[0]);
    const sideList = withHeights(blocks[1]);
    const thirdList = withHeights(blocks[2]);

    const headerHeight =
      fresh.headerHeight +
      (archetype.bandHeader
        ? metrics.mt + metrics.gap
        : 0);

    const result = paginateDocument({
      main: mainList,
      side: doc.layout.columns === 1 ? [] : sideList,
      headerHeight,
      pageHeight: metrics.contentHeight,
      headerGap: metrics.headerGap,
    });

    if (doc.layout.columns !== 3) {
      return {
        ...result,
        third: {
          pages: [] as PlacedBlock[][],
        },
      };
    }

    const third = paginateDocument({
      main: thirdList,
      side: [],
      headerHeight,
      pageHeight: metrics.contentHeight,
      headerGap: metrics.headerGap,
    });

    return {
      pageCount: Math.max(
        result.pageCount,
        third.pageCount,
      ),
      main: result.main,
      side: result.side,
      third: third.main,
    };
  }, [
    mode,
    fresh,
    blocks,
    metrics,
    withHeights,
    doc.layout.columns,
    archetype.bandHeader,
  ]);

  // --------------------------------------------------
  // BLOCK LOOKUP
  // --------------------------------------------------

  const blockMap = useMemo(() => {
    const map = new Map<string, BlockNode>();

    for (const column of [0, 1, 2] as const) {
      for (const block of blocks[column]) {
        map.set(block.key, block);
      }
    }

    return map;
  }, [blocks]);

  const sectionById = useMemo(
    () => new Map(doc.sections.map((section) => [section.id, section])),
    [doc.sections],
  );

  const sectionInlineStyle = useCallback(
    (sectionId: string): CSSProperties => {
      const style = sectionById.get(sectionId)?.textStyle;

      return {
        fontWeight: style?.bold ? 700 : undefined,
        fontStyle: style?.italic ? "italic" : undefined,
        textDecoration: style?.underline ? "underline" : undefined,
        textAlign: style?.textAlign,
        fontSize: style?.fontSize ? `${style.fontSize}pt` : undefined,
        color: style?.color,
      };
    },
    [sectionById],
  );

  const selectBlock = useCallback(
    (sectionId: string) => {
      editor?.selectSection(sectionId);
    },
    [editor],
  );

  // --------------------------------------------------
  // FREE MODE PAGE COUNT
  // --------------------------------------------------

  const freePageCount = useMemo(() => {
    if (!isFreePositionMode) return 1;

    const highestPage = doc.sections.reduce(
      (highest, section) =>
        Math.max(highest, section.position?.page ?? 0),
      0,
    );

    return highestPage + 1;
  }, [doc.sections, isFreePositionMode]);

  const pageCount = isFreePositionMode
    ? freePageCount
    : pagination?.pageCount ?? 1;

  useEffect(() => {
    onPageCount?.(pageCount);
  }, [pageCount, onPageCount]);

  // --------------------------------------------------
  // ROOT STYLING
  // --------------------------------------------------

  const shellStyle: CSSProperties = {
    ...vars,
    transform:
      zoom === 1
        ? undefined
        : `scale(${zoom})`,
    transformOrigin: "top center",
  };

  // --------------------------------------------------
  // BLOCK RENDERER
  // --------------------------------------------------

  const renderBlock = (placed: PlacedBlock) => {
    const baseKey = placed.continued
      ? placed.key.replace(/__cont$/, "")
      : placed.key;

    const block = blockMap.get(baseKey);

    if (!block) return null;

    if (placed.isHead && placed.continued) {
      const section = doc.sections.find(
        (item) => item.id === placed.sectionId,
      );

      return (
        <div
          className={[
            "rp-sec",
            headingClass(
              doc.theme,
              archetype.id === "classic",
            ),
            "rp-sec--continued",
          ].join(" ")}
          key={placed.key}
          data-editor-section-id={editor ? placed.sectionId : undefined}
          data-block-key={placed.key}
          style={{
            ...sectionInlineStyle(placed.sectionId),
            outline:
              editor?.selectedSectionId === placed.sectionId
                ? "1px solid rgba(26, 132, 112, 0.55)"
                : undefined,
          }}
          onClick={() => selectBlock(placed.sectionId)}
        >
          <SectionTitle title={section?.title ?? ""} sectionId={placed.sectionId} />
        </div>
      );
    }

    return (
      <div
        key={placed.key}
        data-block-key={placed.key}
        data-editor-section-id={editor ? placed.sectionId : undefined}
        className={editor ? "rf-canvas-block group" : undefined}
        style={{
          position: "relative",
          ...sectionInlineStyle(placed.sectionId),
          outline:
            editor?.selectedSectionId === placed.sectionId
              ? "1px solid rgba(26, 132, 112, 0.55)"
              : undefined,
        }}
        onClick={() => selectBlock(placed.sectionId)}
      >
        {block.node}
        {renderBlockOverlay?.(baseKey)}
      </div>
    );
  };

  // --------------------------------------------------
  // MASTHEAD
  // --------------------------------------------------

  const masthead = (
    <div
      style={{
        padding: `0 ${metrics.mr}px 0 ${metrics.ml}px`,
      }}
    >
      <Masthead
        doc={doc}
        archetype={archetype}
        inBand={false}
      />
    </div>
  );

  const bandMasthead = (
    <div
      className="rp-band"
      style={{
        padding: `${metrics.mt}px ${metrics.mr}px ${metrics.gap}px ${metrics.ml}px`,
      }}
    >
      <Masthead
        doc={doc}
        archetype={archetype}
        inBand
      />
    </div>
  );

  // --------------------------------------------------
  // FLOW PAGE
  // --------------------------------------------------

  const flowPage = (
    <div
      className="rp-page"
      style={{
        width: metrics.width,
        height: metrics.height,
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: "none" }}>
          {archetype.bandHeader
            ? bandMasthead
            : (
              <div style={{ paddingTop: metrics.mt }}>
                {masthead}
              </div>
            )}
        </div>

        <div
          className="rp-cols"
          style={{
            gridTemplateColumns: order
              .map(
                (key) =>
                  `${metrics.byKey[key]?.width ?? metrics.width}px`,
              )
              .join(" "),
            paddingBottom: metrics.mb,
          }}
        >
          {order.map((key) => {
            const box = metrics.byKey[key];

            if (!box) return null;

            return (
              <div
                key={key}
                className={[
                  "rp-col",
                  key !== 0 ? "rp-col--side" : "",
                  key !== 0 && archetype.tintSidebar
                    ? "is-tinted"
                    : "",
                  archetype.timeline
                    ? "rp-timeline"
                    : "",
                ].filter(Boolean).join(" ")}
                style={{
                  padding: `0 ${box.pad.right}px 0 ${box.pad.left}px`,
                }}
              >
                {blocks[key].map((block) => (
                  <div
                    key={block.key}
                    data-block-key={block.key}
                    data-editor-section-id={editor ? block.sectionId : undefined}
                    className={editor ? "rf-canvas-block group" : undefined}
                    style={{
                      ...sectionInlineStyle(block.sectionId),
                      outline:
                        editor?.selectedSectionId === block.sectionId
                          ? "1px solid rgba(26, 132, 112, 0.55)"
                          : undefined,
                    }}
                    onClick={() => selectBlock(block.sectionId)}
                  >
                    {block.node}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------
  // FREE POSITION SECTION GROUPS
  // --------------------------------------------------

  const freeSections = useMemo(() => {
    const result: FreeSection[] = [];

    const columnOffsets: Record<number, number> = {};
    let horizontalOffset = 0;

    for (const column of order) {
      columnOffsets[column] = horizontalOffset;
      horizontalOffset += metrics.byKey[column]?.width ?? 0;
    }

    const fallbackY: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
    };

    for (const section of doc.sections) {
      const column = (section.column ?? 0) as 0 | 1 | 2;
      const columnBlocks = blocks[column].filter(
        (block) => block.sectionId === section.id,
      );

      if (columnBlocks.length === 0) continue;

      const measuredHeight = columnBlocks.reduce(
        (total, block) =>
          total + (fresh?.heights[block.key] ?? 0),
        0,
      );

      const savedPosition = section.position;

      const x =
        savedPosition?.x ??
        pxToMm(columnOffsets[column] ?? 0);

      const y =
        savedPosition?.y ??
        pxToMm(fallbackY[column] ?? 0);

      const columnBox = metrics.byKey[column];

      const width =
        savedPosition?.width != null
          ? mmToPx(savedPosition.width)
          : columnBox?.inner ?? metrics.contentWidth;

      result.push({
        id: section.id,
        column,
        blocks: columnBlocks,
        x,
        y,
        page: savedPosition?.page ?? 0,
        width,
        zIndex: savedPosition?.zIndex ?? 1,
        locked: savedPosition?.locked ?? false,
      });

      fallbackY[column] =
        (fallbackY[column] ?? 0) +
        Math.max(measuredHeight, 30) +
        12;
    }

    return result;
  }, [
    doc.sections,
    blocks,
    fresh,
    metrics,
    order,
  ]);

  useEffect(() => {
    if (!isFreePositionMode || !onInitializePositions) return;

    const positions = freeSections
      .filter((section) => !sectionById.get(section.id)?.position)
      .map((section) => ({
        id: section.id,
        position: {
          page: section.page,
          x: section.x,
          y: section.y,
        },
      }));

    onInitializePositions(positions);
  }, [
    isFreePositionMode,
    freeSections,
    sectionById,
    onInitializePositions,
  ]);

  if (mode === "flow") {
    return (
      <div
        className={`rp-root ${className ?? ""}`}
        style={shellStyle}
        data-template={template.id}
      >
        {flowPage}
      </div>
    );
  }

  // --------------------------------------------------
  // FREE POSITION PAGE RENDERER
  // --------------------------------------------------

  const renderFreePage = (pageIndex: number) => {
    const isFirst = pageIndex === 0;

    const pageSections = freeSections.filter((section) => {
      const sourceSection = doc.sections.find(
        (item) => item.id === section.id,
      );

      return (sourceSection?.position?.page ?? 0) === pageIndex;
    });

    return (
      <div
        key={`free-page-${pageIndex}`}
        className="rp-page rp-free-page"
        data-page-index={pageIndex}
        style={{
          width: metrics.width,
          height: metrics.height,
          marginBottom: 22,
        }}
      >
        {isFirst && archetype.bandHeader ? (
          bandMasthead
        ) : null}

        {isFirst && !archetype.bandHeader ? (
          <div
            style={{
              flex: "none",
              padding: `${metrics.mt}px ${metrics.mr}px 0 ${metrics.ml}px`,
            }}
          >
            <Masthead
              doc={doc}
              archetype={archetype}
              inBand={false}
            />
          </div>
        ) : null}

        <div
          className="rp-free-canvas"
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            marginLeft: metrics.ml,
            marginRight: metrics.mr,
            marginBottom: metrics.mb,
            overflow: "hidden",
          }}
        >
          {pageSections.map((section) => (
            <div
              key={section.id}
              className={[
                "rp-free-section",
                "is-editable",
                editor ? "rf-canvas-block group" : "",
                editor?.selectedSectionId === section.id ? "is-selected" : "",
                section.locked ? "is-locked" : "",
              ].filter(Boolean).join(" ")}
              data-section-id={section.id}
              data-editor-section-id={editor ? section.id : undefined}
              data-position-page={section.page}
              data-locked={section.locked ? "true" : "false"}
              style={{
                position: "absolute",
                left: mmToPx(section.x),
                top:
                  (isFirst ? metrics.headerGap : 0) +
                  mmToPx(section.y),
                width: section.width,
                zIndex: section.zIndex,
                ...sectionInlineStyle(section.id),
                outline:
                  editor?.selectedSectionId === section.id
                    ? "1px solid rgba(26, 132, 112, 0.55)"
                    : undefined,
              }}
              onClick={() => selectBlock(section.id)}
            >
              {section.blocks.map((block, index) => (
                <div
                  key={block.key}
                  data-block-key={block.key}
                  style={{ position: "relative" }}
                >
                  {block.node}

                  {index === 0
                    ? renderBlockOverlay?.(block.key)
                    : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        {doc.page.showPageNumbers && pageCount > 1 ? (
          <div
            style={{
              position: "absolute",
              bottom: Math.max(metrics.mb / 2.4, 8),
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 9,
              color: doc.theme.mutedColor,
              letterSpacing: "0.08em",
            }}
          >
            {pageIndex + 1} / {pageCount}
          </div>
        ) : null}
      </div>
    );
  };

  // --------------------------------------------------
  // PAGED MODE
  // --------------------------------------------------

  const pages: ReactNode[] = [];

  if (pagination) {
    for (let index = 0; index < pageCount; index += 1) {
      const isFirst = index === 0;

      const pageBlocks: Record<number, PlacedBlock[]> = {
        0: pagination.main.pages[index] ?? [],
        1: pagination.side?.pages[index] ?? [],
        2: pagination.third?.pages[index] ?? [],
      };

      const hasSideContent = pageBlocks[1].length > 0;

      pages.push(
        <div
          key={index}
          className="rp-page"
          data-page-index={index}
          style={{
            width: metrics.width,
            height: metrics.height,
            marginBottom: 22,
          }}
        >
          {archetype.bandHeader && isFirst ? (
            <div
              className="rp-band"
              style={{
                padding: `${metrics.mt}px ${metrics.mr}px ${metrics.gap}px ${metrics.ml}px`,
              }}
            >
              <Masthead
                doc={doc}
                archetype={archetype}
                inBand
              />
            </div>
          ) : null}

          {!archetype.bandHeader && isFirst ? (
            <div
              style={{
                flex: "none",
                padding: `${metrics.mt}px ${metrics.mr}px 0 ${metrics.ml}px`,
              }}
            >
              <Masthead
                doc={doc}
                archetype={archetype}
                inBand={false}
              />
            </div>
          ) : null}

          <div
            className="rp-cols"
            style={{
              gridTemplateColumns: order
                .map(
                  (key) =>
                    `${metrics.byKey[key]?.width ?? metrics.width}px`,
                )
                .join(" "),
              flex: 1,
              minHeight: 0,
            }}
          >
            {order.map((key) => {
              const box = metrics.byKey[key];

              if (!box) return null;

              const list = pageBlocks[key] ?? [];

              const tinted =
                key !== 0 && archetype.tintSidebar;

              const showColumn =
                list.length > 0 ||
                (key === 0 && index === 0);

              if (!showColumn) {
                return <div key={key} />;
              }

              return (
                <div
                  key={key}
                  className={[
                    "rp-col",
                    key !== 0 ? "rp-col--side" : "",
                    tinted && hasSideContent
                      ? "is-tinted"
                      : "",
                    archetype.columnRule &&
                    key !== order[0]
                      ? "rp-col--ruled"
                      : "",
                    archetype.timeline
                      ? "rp-timeline"
                      : "",
                  ].filter(Boolean).join(" ")}
                  style={{
                    paddingTop: isFirst
                      ? metrics.headerGap
                      : box.pad.top,
                    paddingRight: box.pad.right,
                    paddingBottom: box.pad.bottom,
                    paddingLeft: box.pad.left,
                    overflow: "hidden",
                  }}
                >
                  {list.map(renderBlock)}
                </div>
              );
            })}
          </div>

          {doc.page.showPageNumbers && pageCount > 1 ? (
            <div
              style={{
                position: "absolute",
                bottom: Math.max(metrics.mb / 2.4, 8),
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 9,
                color: doc.theme.mutedColor,
                letterSpacing: "0.08em",
              }}
            >
              {index + 1} / {pageCount}
            </div>
          ) : null}
        </div>,
      );
    }
  }

  // --------------------------------------------------
  // FINAL RENDER
  // --------------------------------------------------

  return (
    <div
      className={[
        "rp-root",
        printable ? "rp-print-sheet" : "",
        className ?? "",
      ].filter(Boolean).join(" ")}
      style={shellStyle}
      data-template={template.id}
      data-positioning-mode={
        isFreePositionMode ? "free" : "flow"
      }
    >
      {isFreePositionMode
        ? Array.from(
            { length: freePageCount },
            (_, index) => renderFreePage(index),
          )
        : pagination
          ? pages
          : flowPage}

      <MeasureLayer
        ref={measureRef}
        doc={doc}
        blocks={blocks}
        metrics={metrics}
        vars={vars}
        archetype={archetype}
        order={order}
      />
    </div>
  );
}

// ==================================================
// MASTHEAD
// ==================================================

function Masthead({
  doc,
  archetype,
  inBand,
}: {
  doc: ResumeDocument;
  archetype: ReturnType<typeof archetypeOf>;
  inBand: boolean;
}) {
  const headerLayout =
    archetype.bandHeader && !inBand
      ? "band"
      : doc.layout.headerLayout;

  return (
    <ResumeHeader
      basics={doc.basics}
      theme={doc.theme}
      headerLayout={headerLayout}
      showMonogram={archetype.monogram}
      inBand={inBand}
    />
  );
}

// ==================================================
// MEASUREMENT LAYER
// ==================================================

interface MeasureLayerProps {
  doc: ResumeDocument;
  blocks: Record<0 | 1 | 2, BlockNode[]>;
  metrics: PageMetrics;
  vars: CSSProperties;
  archetype: ReturnType<typeof archetypeOf>;
  order: (0 | 1 | 2)[];
}

const MeasureLayer = ({
  ref,
  doc,
  blocks,
  metrics,
  vars,
  archetype,
  order,
}: MeasureLayerProps & {
  ref: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="rp-root rp-measure-layer"
      style={{
        ...vars,
        position: "absolute",
        left: -40000,
        top: 0,
        width: metrics.contentWidth,
        visibility: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <div
        style={{
          width: metrics.contentWidth,
        }}
        data-mkey="__header"
      >
        <div
          style={{
            paddingBottom: metrics.headerGap,
          }}
        >
          <Masthead
            doc={doc}
            archetype={archetype}
            inBand={false}
          />
        </div>
      </div>

      {order.map((key) => {
        const box = metrics.byKey[key] as
          | ColumnBox
          | undefined;

        if (!box) return null;

        return (
          <div
            key={key}
            style={{
              width: box.inner,
            }}
          >
            {blocks[key].map((block) => (
              <div
                key={block.key}
                data-mkey={block.key}
                style={{
                  width: box.inner,
                }}
              >
                {block.node}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};