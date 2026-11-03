
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import {
  FileText,
  GripVertical,
  Minus,
  Plus,
  Scan,
  Sparkles,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";

import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { firstBlockKey } from "@/components/resume/blocks";
import { getPageMetrics } from "@/lib/resume/renderer/metrics";
import { cn } from "@/lib/utils/cn";
import { isResumeEmpty } from "@/lib/resume/schema/factory";

export function CanvasPanel({
  onPageCount,
}: {
  onPageCount?: (count: number) => void;
}) {
  const doc = useResumeStore((state) => state.doc);
  const moveSection = useResumeStore((state) => state.moveSection);
  const loadSample = useResumeStore((state) => state.loadSample);

  const template = getTemplate(doc.meta.templateId);

  const metrics = useMemo(
    () => getPageMetrics(doc.page, doc.layout),
    [doc.page, doc.layout]
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  // --------------------------------------------------
  // FIT PAGE TO AVAILABLE CANVAS WIDTH
  // --------------------------------------------------

  const recalcFit = useCallback(() => {
    const node = wrapperRef.current;

    if (!node) return;

    const available = node.clientWidth - 64;

    const nextZoom = Math.min(
      1,
      Math.max(0.35, available / metrics.width)
    );

    setZoom(Number(nextZoom.toFixed(3)));
  }, [metrics.width]);

  useEffect(() => {
    if (!fitWidth) return;

    recalcFit();

    const node = wrapperRef.current;

    if (!node) return;

    const observer = new ResizeObserver(() => {
      recalcFit();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [fitWidth, recalcFit]);

  // --------------------------------------------------
  // PAGE COUNT AND NAVIGATION
  // --------------------------------------------------

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageCount, pageIndex]);

  const handlePageCount = useCallback(
    (count: number) => {
      const safeCount = Math.max(1, count);

      setPageCount(safeCount);
      onPageCount?.(safeCount);
    },
    [onPageCount]
  );

  const goToPage = useCallback((index: number) => {
    const safeIndex = Math.max(0, index);

    setPageIndex(safeIndex);

    const node = wrapperRef.current?.querySelector<HTMLElement>(
      `[data-page-index="${safeIndex}"]`
    );

    node?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // --------------------------------------------------
  // SECTION DRAG AND DROP
  // --------------------------------------------------

  const sectionByBlockKey = useMemo(() => {
    const map = new Map<
      string,
      { sectionId: string; column: 0 | 1 | 2 }
    >();

    for (const section of doc.sections) {
      if (!section.visible) continue;

      const key = firstBlockKey(
        section,
        doc.layout.columns
      );

      if (key) {
        map.set(key, {
          sectionId: section.id,
          column: section.column,
        });
      }
    }

    return map;
  }, [doc.sections, doc.layout.columns]);

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { sectionId?: string }
      | undefined;

    setActiveId(data?.sectionId ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over) return;

    const from = (
      active.data.current as
        | { sectionId?: string }
        | undefined
    )?.sectionId;

    const target = doc.sections.find(
      (section) => `drop:${section.id}` === over.id
    );

    if (!from || !target || from === target.id) return;

    moveSection(from, target.id, target.column);
  };

  const isEmpty = useMemo(
    () => isResumeEmpty(doc),
    [doc]
  );

  const activeSection = doc.sections.find(
    (section) => section.id === activeId
  );

  const dragDisabled =
    doc.sections.filter((section) => section.visible).length < 2;

  // --------------------------------------------------
  // ZOOM CONTROLS
  // --------------------------------------------------

  const zoomOut = () => {
    setFitWidth(false);

    setZoom((value) =>
      Math.max(0.35, Number((value - 0.1).toFixed(2)))
    );
  };

  const zoomIn = () => {
    setFitWidth(false);

    setZoom((value) =>
      Math.min(1.6, Number((value + 0.1).toFixed(2)))
    );
  };

  const resetZoom = () => {
    setFitWidth(false);
    setZoom(1);
  };

  const fitToWidth = () => {
    setFitWidth(true);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#efede7]">

      {/* ============================================ */}
      {/* CANVAS HEADER */}
      {/* ============================================ */}

      <div className="z-10 flex h-[48px] shrink-0 items-center justify-between border-b border-black/[0.04] bg-[#f8f7f4] px-4 sm:px-6">

        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-md bg-white text-subtle shadow-sm">
            <FileText className="size-3.5" />
          </div>

          <span className="text-[11px] font-medium text-ink-2">
            Resume preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] text-subtle sm:inline">
            Changes appear automatically
          </span>

          <span className="flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[10px] font-medium text-subtle">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
      </div>

      {/* ============================================ */}
      {/* EMPTY STATE */}
      {/* ============================================ */}

      {isEmpty && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-[440px] flex-col items-center gap-3 rounded-2xl border border-line bg-white/95 px-6 py-6 text-center shadow-xl backdrop-blur-md">

            <div className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
              <FileText className="size-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-ink">
                Your resume starts here
              </h3>

              <p className="text-[12px] leading-relaxed text-subtle">
                Add your information in the Content panel,
                import an existing resume, or load sample
                content to see your selected template in action.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => loadSample()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                <Sparkles className="size-3.5" />
                Load sample content
              </button>

              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>(
                      'input[placeholder="Aarav Mehta"]'
                    )
                    ?.focus()
                }
                className="h-9 rounded-lg border border-line px-4 text-[11px] font-medium text-ink transition-colors hover:bg-surface-2"
              >
                Start typing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* RESUME WORKSPACE */}
      {/* ============================================ */}

      <div
        ref={wrapperRef}
        className={cn(
          "editor-panel min-h-0 flex-1 overflow-auto",
          "px-4 py-8 sm:px-6 lg:px-8 xl:px-10"
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="mx-auto flex w-fit flex-col items-center">

            <ResumeCanvas
              doc={doc}
              template={template}
              mode="paged"
              showEmpty
              zoom={zoom}
              onPageCount={handlePageCount}
              renderBlockOverlay={(blockKey) => {
                const match = sectionByBlockKey.get(blockKey);

                if (!match || dragDisabled) return null;

                return (
                  <SectionTarget
                    sectionId={match.sectionId}
                    column={match.column}
                  />
                );
              }}
            />

          </div>

          <DragOverlay dropAnimation={null}>
            {activeSection ? (
              <div className="flex items-center gap-2 rounded-lg border border-accent bg-white px-3 py-2 text-xs font-semibold text-ink shadow-xl">
                <GripVertical className="size-4 text-accent" />
                {activeSection.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ============================================ */}
      {/* FLOATING PAGE AND ZOOM TOOLBAR */}
      {/* ============================================ */}

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-xl border border-line bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-xl">

          {/* Page navigation */}
          <div className="flex items-center gap-1">

            <button
              type="button"
              onClick={() =>
                goToPage(Math.max(0, pageIndex - 1))
              }
              disabled={pageIndex === 0}
              aria-label="Previous page"
              className="grid size-7 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="min-w-[68px] text-center text-[11px] font-medium tabular-nums text-ink-2">
              {pageIndex + 1} / {pageCount}
            </span>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  Math.min(pageCount - 1, pageIndex + 1)
                )
              }
              disabled={pageIndex >= pageCount - 1}
              aria-label="Next page"
              className="grid size-7 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mx-1 h-5 w-px bg-line" />

          {/* Zoom out */}
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.35}
            aria-label="Zoom out"
            className="grid size-7 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>

          {/* Zoom percentage */}
          <button
            type="button"
            onClick={resetZoom}
            className="min-w-[42px] rounded-md px-1 py-1 text-center text-[11px] font-medium tabular-nums text-ink-2 transition-colors hover:bg-surface-2"
            title="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom in */}
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 1.6}
            aria-label="Zoom in"
            className="grid size-7 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>

          <div className="mx-1 h-5 w-px bg-line" />

          {/* Fit width */}
          <button
            type="button"
            onClick={fitToWidth}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium transition-colors",
              fitWidth
                ? "bg-accent-soft text-accent-ink"
                : "text-subtle hover:bg-surface-2 hover:text-ink"
            )}
            title="Fit to available width"
          >
            <Scan className="size-3.5" />
            <span className="hidden sm:inline">Fit</span>
          </button>

          {/* Actual size */}
          <button
            type="button"
            onClick={resetZoom}
            className="hidden h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-medium text-subtle transition-colors hover:bg-surface-2 hover:text-ink sm:inline-flex"
            title="Actual size"
          >
            <Maximize2 className="size-3.5" />
            100%
          </button>

        </div>
      </div>
    </div>
  );
}

// ==================================================
// DRAGGABLE SECTION TARGET
// ==================================================

function SectionTarget({
  sectionId,
  column,
}: {
  sectionId: string;
  column: 0 | 1 | 2;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `drag:${sectionId}`,
    data: { sectionId, column },
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop:${sectionId}`,
    data: { sectionId, column },
  });

  return (
    <div
      ref={setDropRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="false"
    >
      {/* Drop indicator */}
      {isOver && (
        <span className="pointer-events-none absolute -left-2 -right-2 -top-1 h-[2px] rounded-full bg-accent shadow-[0_0_0_3px_rgba(13,107,95,0.12)]" />
      )}

      {/* Drag handle */}
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "pointer-events-auto absolute -left-[26px] top-0",
          "grid size-6 place-items-center rounded-md",
          "border border-line bg-white text-subtle shadow-sm",
          "cursor-grab opacity-0 transition-all",
          "hover:border-accent hover:text-accent",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "active:cursor-grabbing",
          isDragging && "opacity-100",
          isOver && "border-accent text-accent opacity-100"
        )}
        style={{
          opacity: isOver || isDragging ? 1 : undefined,
        }}
        aria-label="Drag section to reorder"
        title="Drag to reorder or move to another column"
      >
        <GripVertical className="size-3.5" />
      </button>
    </div>
  );
}
