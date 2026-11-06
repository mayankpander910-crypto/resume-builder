
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
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Italic,
  MoveDown,
  MoveUp,
  Trash2,
  Underline,
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
  LayoutGrid,
  Move,
  Lock,
  Unlock,
  PanelLeft,
  SlidersHorizontal,
  Undo2,
  Redo2,
} from "lucide-react";
import { createPortal } from "react-dom";

import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { firstBlockKey } from "@/components/resume/blocks";
import { getPageMetrics } from "@/lib/resume/renderer/metrics";
import { cn } from "@/lib/utils/cn";
import { isResumeEmpty } from "@/lib/resume/schema/factory";
import {
  InlineEditorProvider,
  type InlineEditorContextValue,
} from "@/components/editor/InlineEditable";
import type { SectionTextStyle } from "@/types/resume";

const MM_PER_PX = 25.4 / 96;

const dragDeltaToMm = (deltaPx: number, zoomLevel: number) => {
  if (!Number.isFinite(deltaPx)) return 0;

  return (deltaPx * MM_PER_PX) / Math.max(zoomLevel, 0.01);
};

export function CanvasPanel({
  onPageCount,
  onOpenContent,
  onOpenDesign,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  onPageCount?: (count: number) => void;
  onOpenContent?: () => void;
  onOpenDesign?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  const doc = useResumeStore((state) => state.doc);

  const moveSection = useResumeStore((state) => state.moveSection);
  const moveCanvasSection = useResumeStore(
    (state) => state.moveCanvasSection
  );
  const setPositioningMode = useResumeStore(
    (state) => state.setPositioningMode
  );
  const setSectionLocked = useResumeStore(
    (state) => state.setSectionLocked
  );
  const initializeCanvasPositions = useResumeStore(
    (state) => state.initializeCanvasPositions
  );
  const updateBasics = useResumeStore((state) => state.updateBasics);
  const updateSection = useResumeStore((state) => state.updateSection);
  const duplicateSection = useResumeStore((state) => state.duplicateSection);
  const removeSection = useResumeStore((state) => state.removeSection);

  const loadSample = useResumeStore((state) => state.loadSample);

  const template = getTemplate(doc.meta.templateId);

  const metrics = useMemo(
    () => getPageMetrics(doc.page, doc.layout),
    [doc.page, doc.layout]
  );

  const positioningMode = doc.layout.positioningMode ?? "flow";
  const isFreeMode = positioningMode === "free";

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const inlineEditor = useMemo<InlineEditorContextValue>(
    () => ({
      selectedSectionId,
      selectSection: setSelectedSectionId,
      updateBasics,
      updateSection: (id, updater) => updateSection(id, updater),
    }),
    [selectedSectionId, updateBasics, updateSection]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const updateToolbarPosition = useCallback(() => {
    if (!selectedSectionId) {
      setToolbarPosition(null);
      return;
    }

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-editor-section-id]")
    ).filter((node) => node.dataset.editorSectionId === selectedSectionId);

    if (nodes.length === 0) {
      setToolbarPosition(null);
      return;
    }

    const rects = nodes.map((node) => node.getBoundingClientRect());
    const top = Math.min(...rects.map((rect) => rect.top));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    const toolbarWidth = Math.min(440, window.innerWidth - 16);
    const nextLeft = Math.max(
      8,
      Math.min(window.innerWidth - toolbarWidth - 8, (left + right) / 2 - toolbarWidth / 2)
    );
    const nextTop =
      top >= 68
        ? top - 60
        : Math.min(window.innerHeight - 60, bottom + 8);

    setToolbarPosition({ left: nextLeft, top: Math.max(8, nextTop) });
  }, [selectedSectionId]);

  useEffect(() => {
    if (!selectedSectionId) {
      setToolbarPosition(null);
      return;
    }

    const frame = requestAnimationFrame(updateToolbarPosition);
    window.addEventListener("resize", updateToolbarPosition);
    window.addEventListener("scroll", updateToolbarPosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateToolbarPosition);
      window.removeEventListener("scroll", updateToolbarPosition, true);
    };
  }, [selectedSectionId, updateToolbarPosition]);

  useEffect(() => {
    const onOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest("[data-editor-section-id]") ||
        target.closest("[data-inline-toolbar]")
      ) {
        return;
      }

      setSelectedSectionId(null);
    };

    document.addEventListener("pointerdown", onOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", onOutsidePointerDown);
  }, []);

  /* ------------------------------------------------------------
   * FIT PAGE TO AVAILABLE CANVAS WIDTH
   * ------------------------------------------------------------ */

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

  /* ------------------------------------------------------------
   * PAGE COUNT AND NAVIGATION
   * ------------------------------------------------------------ */

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

  /* ------------------------------------------------------------
   * SECTION LOOKUP
   * ------------------------------------------------------------ */

  const sectionByBlockKey = useMemo(() => {
    const map = new Map<
      string,
      {
        sectionId: string;
        column: 0 | 1 | 2;
        locked: boolean;
      }
    >();

    for (const section of doc.sections) {
      if (!section.visible) continue;

      const key = firstBlockKey(
        section,
        doc.layout.columns
      );

      if (!key) continue;

      map.set(key, {
        sectionId: section.id,
        column: section.column,
        locked: section.position?.locked === true,
      });
    }

    return map;
  }, [doc.sections, doc.layout.columns]);

  /* ------------------------------------------------------------
   * SECTION DRAG AND DROP
   * ------------------------------------------------------------ */

  const dragStartPositionRef = useRef<{
    id: string;
    x: number;
    y: number;
    page: number;
  } | null>(null);

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { sectionId?: string }
      | undefined;

    const sectionId = data?.sectionId ?? null;
    setActiveId(sectionId);

    if (!sectionId || !isFreeMode) return;

    const node = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section-id]")
    ).find((element) => element.dataset.sectionId === sectionId);

    if (!node) return;

    const page = Number(node.dataset.positionPage ?? 0);
    const rect = node.getBoundingClientRect();
    const currentPosition = doc.sections.find((item) => item.id === sectionId)?.position;

    const baseX = currentPosition?.x ?? (rect.left - node.parentElement!.getBoundingClientRect().left) * MM_PER_PX;
    const baseY = currentPosition?.y ?? (rect.top - node.parentElement!.getBoundingClientRect().top) * MM_PER_PX;

    dragStartPositionRef.current = {
      id: sectionId,
      x: baseX,
      y: baseY,
      page: currentPosition?.page ?? page,
    };
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over, delta } = event;

    const from = (
      active.data.current as
        | { sectionId?: string }
        | undefined
    )?.sectionId;

    if (!from) {
      dragStartPositionRef.current = null;
      return;
    }

    const activeSection = doc.sections.find(
      (section) => section.id === from
    );

    if (!activeSection) {
      dragStartPositionRef.current = null;
      return;
    }

    if (activeSection.position?.locked) {
      dragStartPositionRef.current = null;
      return;
    }

    /* Free positioning: update canvas coordinates. */
    if (isFreeMode) {
      if (delta.x === 0 && delta.y === 0) {
        dragStartPositionRef.current = null;
        return;
      }

      const currentPosition = activeSection.position ??
        (dragStartPositionRef.current?.id === from
          ? {
              page: dragStartPositionRef.current.page,
              x: dragStartPositionRef.current.x,
              y: dragStartPositionRef.current.y,
            }
          : {
              page: pageIndex,
              x: 0,
              y: 0,
            });

      const nextX = currentPosition.x + dragDeltaToMm(delta.x, zoom);
      const nextY = currentPosition.y + dragDeltaToMm(delta.y, zoom);

      moveCanvasSection(from, nextX, nextY, currentPosition.page);

      dragStartPositionRef.current = null;
      return;
    }

    /* Flow positioning: retain the existing section reordering. */
    if (!over) {
      dragStartPositionRef.current = null;
      return;
    }

    const target = doc.sections.find(
      (section) => `drop:${section.id}` === over.id
    );

    if (!target || from === target.id) {
      dragStartPositionRef.current = null;
      return;
    }

    moveSection(from, target.id, target.column);
    dragStartPositionRef.current = null;
  };

  const isEmpty = useMemo(
    () => isResumeEmpty(doc),
    [doc]
  );

  const activeSection = doc.sections.find(
    (section) => section.id === activeId
  );
  const selectedSection = doc.sections.find(
    (section) => section.id === selectedSectionId
  );

  const updateTextStyle = (patch: Partial<SectionTextStyle>) => {
    if (!selectedSectionId) return;

    updateSection(
      selectedSectionId,
      (section) => {
        section.textStyle = {
          ...section.textStyle,
          ...patch,
        };
      },
      { historyKey: `text-style:${selectedSectionId}` }
    );
  };

  const moveSelectedSection = (direction: -1 | 1) => {
    if (!selectedSection) return;

    if (isFreeMode) {
      const position = selectedSection.position ?? {
        page: pageIndex,
        x: 0,
        y: 0,
      };

      moveCanvasSection(
        selectedSection.id,
        position.x,
        Math.max(0, position.y + direction * 4),
        position.page
      );
      return;
    }

    const sameColumn = doc.sections.filter(
      (section) => section.column === selectedSection.column
    );
    const index = sameColumn.findIndex(
      (section) => section.id === selectedSection.id
    );
    const targetIndex = direction < 0 ? index - 1 : index + 2;

    if (targetIndex < 0) return;

    const target = sameColumn[targetIndex];
    moveSection(
      selectedSection.id,
      target?.id ?? null,
      selectedSection.column
    );
  };

  const editSelectedText = () => {
    if (!selectedSectionId) return;

    const section = Array.from(
      document.querySelectorAll<HTMLElement>("[data-editor-section-id]")
    ).find((node) => node.dataset.editorSectionId === selectedSectionId);
    const editable = section?.querySelector<HTMLElement>(
      '[data-inline-editable="true"]'
    );

    if (!editable) return;

    editable.focus();
    editable.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      })
    );
  };

  const dragDisabled =
    !isFreeMode && doc.sections.filter((section) => section.visible).length < 2;

  /* ------------------------------------------------------------
   * POSITIONING MODE
   * ------------------------------------------------------------ */

  const changePositioningMode = (
    mode: "flow" | "free"
  ) => {
    if (mode === positioningMode) return;

    setPositioningMode(mode);
    setActiveId(null);
    setSelectedSectionId(null);
  };

  /* ------------------------------------------------------------
   * ZOOM CONTROLS
   * ------------------------------------------------------------ */

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

  /* ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------ */

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#efede7]">

      {/* CANVAS HEADER */}

      <div className="z-10 flex min-h-[48px] shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-black/[0.04] bg-[#f8f7f4] px-4 py-2 sm:px-6">

        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-md bg-white text-subtle shadow-sm">
            <FileText className="size-3.5" />
          </div>

          <span className="text-[11px] font-medium text-ink-2">
            Resume preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenContent && (
            <button
              type="button"
              onClick={onOpenContent}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-black/5 bg-white px-3 text-[11px] font-medium text-ink shadow-sm transition-colors hover:bg-surface-2"
            >
              <PanelLeft className="size-3.5" />
              Content
            </button>
          )}
          {onOpenDesign && (
            <button
              type="button"
              onClick={onOpenDesign}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-black/5 bg-white px-3 text-[11px] font-medium text-ink shadow-sm transition-colors hover:bg-surface-2"
            >
              <SlidersHorizontal className="size-3.5" />
              Design
            </button>
          )}
          {onUndo && onRedo && (
            <div className="flex items-center gap-0.5 rounded-lg border border-black/5 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
                title="Undo"
                className="grid size-7 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Undo2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
                title="Redo"
                className="grid size-7 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Redo2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">

          {/* POSITIONING MODE SWITCH */}

          <div className="flex items-center rounded-lg border border-line bg-white p-0.5">

            <button
              type="button"
              onClick={() => changePositioningMode("flow")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] font-medium transition-colors",
                !isFreeMode
                  ? "bg-accent-soft text-accent-ink"
                  : "text-subtle hover:bg-surface-2 hover:text-ink"
              )}
              title="Use automatic document flow"
              aria-pressed={!isFreeMode}
            >
              <LayoutGrid className="size-3.5" />
              Flow
            </button>

            <button
              type="button"
              onClick={() => changePositioningMode("free")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] font-medium transition-colors",
                isFreeMode
                  ? "bg-accent-soft text-accent-ink"
                  : "text-subtle hover:bg-surface-2 hover:text-ink"
              )}
              title="Position sections freely"
              aria-pressed={isFreeMode}
            >
              <Move className="size-3.5" />
              Free
            </button>

          </div>

          <span className="hidden text-[10px] text-subtle sm:inline">
            Changes appear automatically
          </span>

          <span className="flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[10px] font-medium text-subtle">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
      </div>

      {/* EMPTY STATE */}

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

      {/* RESUME WORKSPACE */}

      <div
        ref={wrapperRef}
        onClick={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            !target.closest("[data-editor-section-id]")
          ) {
            setSelectedSectionId(null);
          }
        }}
        className={cn(
          "editor-panel min-h-0 flex-1 overflow-auto",
          "px-4 py-8 sm:px-6 lg:px-8 xl:px-10"
        )}
      >
        <InlineEditorProvider value={inlineEditor}>
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
                onInitializePositions={initializeCanvasPositions}
                renderBlockOverlay={(blockKey) => {
                  const match = sectionByBlockKey.get(blockKey);

                  if (!match || (dragDisabled && !isFreeMode)) return null;

                  return (
                    <SectionTarget
                      key={match.sectionId}
                      sectionId={match.sectionId}
                      column={match.column}
                      locked={match.locked}
                      freeMode={isFreeMode}
                      onToggleLock={(locked) =>
                        setSectionLocked(match.sectionId, locked)
                      }
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
        </InlineEditorProvider>
      </div>

      {selectedSection && toolbarPosition
        ? createPortal(
            <div
              data-inline-toolbar
              role="toolbar"
              aria-label={`${selectedSection.title} formatting and section actions`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              className="rf-floating-toolbar"
              style={{
                position: "fixed",
                left: toolbarPosition.left,
                top: toolbarPosition.top,
              }}
            >
              <button
                type="button"
                onClick={editSelectedText}
                aria-label="Edit text"
                title="Edit text"
                className="rf-toolbar-button"
              >
                <span className="text-[11px] font-medium">Edit</span>
              </button>

              <span className="rf-toolbar-divider" />

              <button
                type="button"
                onClick={() =>
                  updateTextStyle({ bold: !selectedSection.textStyle?.bold })
                }
                aria-label="Bold"
                aria-pressed={selectedSection.textStyle?.bold === true}
                title="Bold"
                className="rf-toolbar-button"
              >
                <Bold className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateTextStyle({ italic: !selectedSection.textStyle?.italic })
                }
                aria-label="Italic"
                aria-pressed={selectedSection.textStyle?.italic === true}
                title="Italic"
                className="rf-toolbar-button"
              >
                <Italic className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateTextStyle({
                    underline: !selectedSection.textStyle?.underline,
                  })
                }
                aria-label="Underline"
                aria-pressed={selectedSection.textStyle?.underline === true}
                title="Underline"
                className="rf-toolbar-button"
              >
                <Underline className="size-4" />
              </button>

              <span className="rf-toolbar-divider" />

              <div className="flex items-center">
                {([
                  ["left", AlignLeft],
                  ["center", AlignCenter],
                  ["right", AlignRight],
                  ["justify", AlignJustify],
                ] as const).map(([alignment, Icon]) => (
                  <button
                    key={alignment}
                    type="button"
                    onClick={() => updateTextStyle({ textAlign: alignment })}
                    aria-label={`Align ${alignment}`}
                    aria-pressed={
                      (selectedSection.textStyle?.textAlign ?? "left") === alignment
                    }
                    title={`Align ${alignment}`}
                    className="rf-toolbar-button"
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>

              <select
                aria-label="Font size"
                value={selectedSection.textStyle?.fontSize ?? ""}
                onChange={(event) =>
                  updateTextStyle({
                    fontSize: event.currentTarget.value
                      ? Number(event.currentTarget.value)
                      : undefined,
                  })
                }
                className="h-8 rounded-md border border-transparent bg-transparent px-1 text-[11px] text-ink outline-none hover:bg-surface-2 focus:border-accent"
              >
                <option value="">Size</option>
                {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36].map((size) => (
                  <option value={size} key={size}>{size} pt</option>
                ))}
              </select>

              <label
                className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-surface-2"
                title="Text color"
              >
                <input
                  type="color"
                  aria-label="Text color"
                  value={selectedSection.textStyle?.color ?? doc.theme.textColor}
                  onChange={(event) =>
                    updateTextStyle({ color: event.currentTarget.value })
                  }
                  className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>

              <span className="rf-toolbar-divider" />

              <button
                type="button"
                onClick={() => moveSelectedSection(-1)}
                aria-label="Move section up"
                title={isFreeMode ? "Move section up" : "Move section earlier"}
                className="rf-toolbar-button"
              >
                <MoveUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => moveSelectedSection(1)}
                aria-label="Move section down"
                title={isFreeMode ? "Move section down" : "Move section later"}
                className="rf-toolbar-button"
              >
                <MoveDown className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => duplicateSection(selectedSection.id)}
                aria-label="Duplicate section"
                title="Duplicate section"
                className="rf-toolbar-button"
              >
                <Copy className="size-4" />
              </button>
              {isFreeMode ? (
                <button
                  type="button"
                  onClick={() =>
                    setSectionLocked(
                      selectedSection.id,
                      !selectedSection.position?.locked
                    )
                  }
                  aria-label={
                    selectedSection.position?.locked
                      ? "Unlock section"
                      : "Lock section"
                  }
                  title={
                    selectedSection.position?.locked
                      ? "Unlock section"
                      : "Lock section"
                  }
                  className="rf-toolbar-button"
                >
                  {selectedSection.position?.locked ? (
                    <Unlock className="size-4" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  removeSection(selectedSection.id);
                  setSelectedSectionId(null);
                }}
                aria-label="Delete section"
                title="Delete section"
                className="rf-toolbar-button is-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>,
            document.body
          )
        : null}

      {/* FLOATING PAGE AND ZOOM TOOLBAR */}

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-xl border border-line bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-xl">

          {/* PAGE NAVIGATION */}

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

          {/* ZOOM OUT */}

          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.35}
            aria-label="Zoom out"
            className="grid size-7 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>

          {/* ZOOM PERCENTAGE */}

          <button
            type="button"
            onClick={resetZoom}
            className="min-w-[42px] rounded-md px-1 py-1 text-center text-[11px] font-medium tabular-nums text-ink-2 transition-colors hover:bg-surface-2"
            title="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* ZOOM IN */}

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

          {/* FIT WIDTH */}

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

          {/* ACTUAL SIZE */}

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

/* ============================================================
 * DRAGGABLE SECTION TARGET
 * ============================================================ */

function SectionTarget({
  sectionId,
  column,
  locked,
  freeMode,
  onToggleLock,
}: {
  sectionId: string;
  column: 0 | 1 | 2;
  locked: boolean;
  freeMode: boolean;
  onToggleLock: (locked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `drag:${sectionId}`,
    data: {
      sectionId,
      column,
    },
    disabled: locked,
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop:${sectionId}`,
    data: {
      sectionId,
      column,
    },
    disabled: freeMode,
  });

  return (
    <div
      ref={setDropRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="false"
    >
      {/* DROP INDICATOR */}

      {!freeMode && isOver && (
        <span className="pointer-events-none absolute -left-2 -right-2 -top-1 h-[2px] rounded-full bg-accent shadow-[0_0_0_3px_rgba(13,107,95,0.12)]" />
      )}

      {/* DRAG HANDLE */}

      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        disabled={locked}
        className={cn(
          "pointer-events-auto absolute",
          freeMode ? "left-0 -top-7" : "-left-[26px] top-0",
          "grid size-6 place-items-center rounded-md",
          "border border-line bg-white text-subtle shadow-sm",
          "cursor-grab opacity-0 transition-all",
          "hover:border-accent hover:text-accent",
          "group-hover:opacity-100",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "active:cursor-grabbing",
          "rf-drag-handle",
          isDragging && "opacity-100",
          isOver && "border-accent text-accent opacity-100",
          locked && "cursor-not-allowed opacity-40"
        )}
        style={{
          opacity: isOver || isDragging ? 1 : undefined,
        }}
        aria-label={
          locked
            ? "Section is locked"
            : freeMode
              ? "Drag section to reposition"
              : "Drag section to reorder"
        }
        title={
          locked
            ? "Unlock this section to move it"
            : freeMode
              ? "Drag to reposition section"
              : "Drag to reorder or move to another column"
        }
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* FREE MODE LOCK CONTROL */}

      {freeMode && (
        <button
          type="button"
          onClick={() => onToggleLock(!locked)}
          className={cn(
            "pointer-events-auto absolute",
            freeMode ? "left-0 top-0" : "-left-[26px] top-7",
            "grid size-6 place-items-center rounded-md",
            "border border-line bg-white shadow-sm",
            "opacity-0 transition-all hover:border-accent hover:text-accent",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            "rf-lock-control",
            locked
              ? "border-accent text-accent opacity-100"
              : "text-subtle group-hover:opacity-100"
          )}
          aria-label={locked ? "Unlock section" : "Lock section"}
          title={locked ? "Unlock section" : "Lock section"}
        >
          {locked ? (
            <Lock className="size-3" />
          ) : (
            <Unlock className="size-3" />
          )}
        </button>
      )}
    </div>
  );
}
