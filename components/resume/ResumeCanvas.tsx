
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

export interface ResumeCanvasProps {
  doc: ResumeDocument;
  template: ResumeTemplate;

  /** Paged mode is used by the editor, preview and print. */
  mode?: "paged" | "flow";

  showEmpty?: boolean;
  zoom?: number;
  className?: string;

  /** Render editor overlays and drag handles inside blocks. */
  renderBlockOverlay?: (blockKey: string) => ReactNode;

  onPageCount?: (count: number) => void;

  /** Adds the printable wrapper class. */
  printable?: boolean;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Measured {
  heights: Record<string, number>;
  headerHeight: number;
  signature: string;
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
  printable,
}: ResumeCanvasProps) {
  // --------------------------------------------------
  // TEMPLATE AND DOCUMENT CONFIGURATION
  // --------------------------------------------------

  const archetype = archetypeOf(template.archetype);

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

  // --------------------------------------------------
  // MEASUREMENT STATE
  // --------------------------------------------------

  const measureRef = useRef<HTMLDivElement | null>(null);

  const [measured, setMeasured] = useState<Measured | null>(null);

  /**
   * Include the complete document in the signature.
   *
   * This ensures that content changes invalidate old
   * measurements, including descriptions and bullet points.
   */
  const signature = useMemo(
    () =>
      JSON.stringify([
        doc,
        mode,
        showEmpty,
      ]),
    [doc, mode, showEmpty],
  );

  /**
   * Measure the actual rendered height of every resume block.
   */
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

  /**
   * Initial measurement after DOM layout.
   */
  useIsomorphicLayoutEffect(() => {
    if (mode !== "paged") return;

    measure();
  }, [measure, mode]);

  /**
   * Measure again after browser paint and font loading.
   */
  useEffect(() => {
    if (mode !== "paged") return;

    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      if (!cancelled) {
        measure();
      }
    });

    const fontSet = document.fonts;

    fontSet?.ready.then(() => {
      if (!cancelled) {
        measure();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [measure, mode]);

  /**
   * Measurements are valid only for the current document.
   */
  const fresh =
    measured && measured.signature === signature
      ? measured
      : null;

  // --------------------------------------------------
  // APPLY MEASUREMENTS TO BLOCKS
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

    const hasTertiary = doc.layout.columns === 3;

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

    if (!hasTertiary) {
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

  const pageCount = pagination?.pageCount ?? 1;

  // --------------------------------------------------
  // REPORT PAGE COUNT
  // --------------------------------------------------

  useEffect(() => {
    onPageCount?.(pageCount);
  }, [pageCount, onPageCount]);

  // --------------------------------------------------
  // BLOCK LOOKUP
  // --------------------------------------------------

  const blockMap = useMemo(() => {
    const map = new Map<string, BlockNode>();

    for (const key of [0, 1, 2] as const) {
      for (const block of blocks[key]) {
        map.set(block.key, block);
      }
    }

    return map;
  }, [blocks]);

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
  // RENDER PAGINATED BLOCK
  // --------------------------------------------------

  const renderBlock = (placed: PlacedBlock) => {
    const baseKey = placed.continued
      ? placed.key.replace(/__cont$/, "")
      : placed.key;

    const block = blockMap.get(baseKey);

    if (!block) return null;

    // Repeated heading on continuation pages.
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
        >
          <SectionTitle title={section?.title ?? ""} />
        </div>
      );
    }

    return (
      <div
        key={placed.key}
        data-block-key={placed.key}
        style={{ position: "relative" }}
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
                  <div key={block.key}>
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
  // FLOW MODE
  // --------------------------------------------------

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
  // PAGED MODE: PAGE CONTENT
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
          {/* Band header: first page only */}
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

          {/* Standard header: first page only */}
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

          {/* Resume columns */}
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

          {/* Page numbering */}
          {doc.page.showPageNumbers && pageCount > 1 ? (
            <div
              style={{
                position: "absolute",
                bottom: Math.max(
                  metrics.mb / 2.4,
                  8,
                ),
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
  // FINAL PAGED RENDER
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
    >
      {/*
        IMPORTANT:
        The measurement layer must always be mounted in
        paged mode, including before pagination is ready.

        Previously, the component returned flowPage when
        pagination was null. That prevented MeasureLayer
        from mounting, so measurements never became ready.
      */}

      {pagination ? pages : flowPage}

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
      className="rp-root"
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
      {/* Measure header */}
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

      {/* Measure every column and its blocks */}
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
