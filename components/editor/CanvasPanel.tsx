"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { FileText, GripVertical, Minus, Plus, Scan, Sparkles, ZoomIn } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { firstBlockKey } from "@/components/resume/blocks";
import { getPageMetrics } from "@/lib/resume/renderer/metrics";
import { cn } from "@/lib/utils/cn";
import { isResumeEmpty } from "@/lib/resume/schema/factory";


export function CanvasPanel({ onPageCount }: { onPageCount?: (count: number) => void }) {
  const doc = useResumeStore((state) => state.doc);
  const moveSection = useResumeStore((state) => state.moveSection);
  const loadSample = useResumeStore((state) => state.loadSample);
  const template = getTemplate(doc.meta.templateId);
  const metrics = useMemo(() => getPageMetrics(doc.page, doc.layout), [doc.page, doc.layout]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const recalcFit = useCallback(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const available = node.clientWidth - 80;
    setZoom(Math.min(1, Math.max(0.35, available / metrics.width)));
  }, [metrics.width]);

  useEffect(() => {
    if (!fitWidth) return;
    recalcFit();
    const observer = new ResizeObserver(recalcFit);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [fitWidth, recalcFit]);

  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(0);
  }, [pageCount, pageIndex]);

  const sectionByBlockKey = useMemo(() => {
    const map = new Map<string, { sectionId: string; column: 0 | 1 | 2 }>();
    for (const section of doc.sections) {
      if (!section.visible) continue;
      const key = firstBlockKey(section, doc.layout.columns);
      if (key) map.set(key, { sectionId: section.id, column: section.column });
    }
    return map;
  }, [doc.sections, doc.layout.columns]);

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { sectionId?: string } | undefined;
    setActiveId(data?.sectionId ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const from = (active.data.current as { sectionId?: string } | undefined)?.sectionId;
    const target = doc.sections.find((section) => `drop:${section.id}` === over.id);
    if (!from || !target || from === target.id) return;
    moveSection(from, target.id, target.column);
  };

  const goToPage = (index: number) => {
    setPageIndex(index);
    const node = wrapperRef.current?.querySelector<HTMLElement>(`[data-page-index="${index}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isEmpty = useMemo(() => isResumeEmpty(doc), [doc]);
  const activeSection = doc.sections.find((section) => section.id === activeId);
  const dragDisabled = doc.sections.filter((section) => section.visible).length < 2;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#ebe8e1]">
      {isEmpty ? (
        <div className="absolute inset-x-0 bottom-20 z-10 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-md flex-col items-center gap-2 rounded-[9px] border border-line bg-surface/95 px-4 py-3 text-center shadow-[var(--shadow-card)] backdrop-blur">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
              <FileText className="size-3.5 text-accent" /> This page is empty — nothing to break yet
            </p>
            <p className="text-[11.5px] leading-relaxed text-subtle">
              Fill in your details on the left, paste an existing resume, or drop in a sample to see how the template behaves.
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => loadSample()}
                className="inline-flex items-center gap-1 rounded-[5px] bg-accent px-2.5 py-1.5 text-[11.5px] font-medium text-white hover:bg-accent-hover"
              >
                <Sparkles className="size-3" /> Load sample content
              </button>
              <button
                type="button"
                onClick={() => document.querySelector<HTMLInputElement>("input[placeholder=\"Aarav Mehta\"]")?.focus()}
                className="rounded-[5px] border border-line-strong px-2.5 py-1.5 text-[11.5px] font-medium text-ink hover:bg-surface-2"
              >
                Start typing
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div ref={wrapperRef} className="editor-panel flex-1 overflow-auto px-10 py-8">
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="mx-auto flex w-fit flex-col items-center">
            <ResumeCanvas
              doc={doc}
              template={template}
              mode="paged"
              showEmpty
              zoom={zoom}
              onPageCount={(count) => {
                setPageCount(count);
                onPageCount?.(count);
              }}
              renderBlockOverlay={(blockKey) => {
                const match = sectionByBlockKey.get(blockKey);
                if (!match || dragDisabled) return null;
                return <SectionTarget sectionId={match.sectionId} column={match.column} />;
              }}
            />
          </div>
          <DragOverlay dropAnimation={null}>
            {activeSection ? (
              <div className="section-drag-overlay flex items-center gap-2 rounded-[5px] border border-accent bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink">
                <GripVertical className="size-3.5 text-accent" />
                {activeSection.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-line bg-surface/95 px-1.5 py-1 shadow-[var(--shadow-card)] backdrop-blur">
          {pageCount > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goToPage(Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0}
                className="grid size-6 place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                aria-label="Previous page"
              >
                <Minus className="size-3" />
              </button>
              <span className="px-1 text-[11px] tabular-nums text-subtle">
                Page {pageIndex + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => goToPage(Math.min(pageCount - 1, pageIndex + 1))}
                disabled={pageIndex >= pageCount - 1}
                className="grid size-6 place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                aria-label="Next page"
              >
                <Plus className="size-3" />
              </button>
              <span className="mx-1 h-4 w-px bg-line" />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setFitWidth(false);
              setZoom((value) => Math.max(0.35, Number((value - 0.1).toFixed(2))));
            }}
            className="grid size-6 place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-ink"
            aria-label="Zoom out"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-9 text-center text-[11px] tabular-nums text-subtle">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => {
              setFitWidth(false);
              setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))));
            }}
            className="grid size-6 place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-ink"
            aria-label="Zoom in"
          >
            <Plus className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => setFitWidth(true)}
            className={cn(
              "ml-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors",
              fitWidth ? "bg-accent-soft text-accent-ink" : "text-subtle hover:bg-surface-2 hover:text-ink",
            )}
            title="Fit to width"
          >
            <Scan className="size-3" /> Fit
          </button>
          <button
            type="button"
            onClick={() => {
              setFitWidth(false);
              setZoom(1);
            }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-subtle hover:bg-surface-2 hover:text-ink"
            title="Actual size"
          >
            <ZoomIn className="size-3" /> 100%
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTarget({ sectionId, column }: { sectionId: string; column: 0 | 1 | 2 }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drag:${sectionId}`,
    data: { sectionId, column },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop:${sectionId}`, data: { sectionId, column } });

  return (
    <div ref={setDropRef} className="pointer-events-none absolute inset-0" aria-hidden={false}>
      {isOver ? (
        <span className="pointer-events-none absolute -left-2 -right-2 -top-1 h-[2px] rounded-full bg-accent shadow-[0_0_0_3px_rgba(13,107,95,0.14)]" />
      ) : null}
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "pointer-events-auto absolute -left-[26px] top-0 grid size-5 cursor-grab place-items-center rounded-[3px] border border-line bg-white text-subtle opacity-0 shadow-sm transition-opacity hover:text-ink focus-visible:opacity-100 active:cursor-grabbing group-hover/block:opacity-100",
          isDragging && "opacity-100",
        )}
        style={{ opacity: isOver ? 1 : undefined }}
        aria-label="Drag section to reorder"
        title="Drag to reorder or move to another column"
        onMouseEnter={(event) => {
          (event.currentTarget as HTMLElement).style.opacity = "1";
        }}
        onMouseLeave={(event) => {
          if (!isDragging) (event.currentTarget as HTMLElement).style.opacity = "";
        }}
      >
        <GripVertical className="size-3" />
      </button>
    </div>
  );
}
