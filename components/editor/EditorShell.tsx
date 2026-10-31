"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Cloud,
  Download,
  Eye,
  FileJson,
  FileText,
  LayoutTemplate,
  Redo2,
  Sparkles,
  SlidersHorizontal,
  Undo2,
  Upload,
  MoreHorizontal,
  RotateCcw,
  PanelsTopLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { ContentPanel } from "@/components/editor/ContentPanel";
import { DesignPanel } from "@/components/editor/DesignPanel";
import { CanvasPanel } from "@/components/editor/CanvasPanel";
import { AiPanel, type AiTarget } from "@/components/editor/AiPanel";
import { ImportDialog, TemplateDialog } from "@/components/editor/dialogs";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, Badge } from "@/components/ui/misc";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlay";
import { useMediaQuery } from "@/lib/utils/use-media";
import { cn } from "@/lib/utils/cn";

const AUTOSAVE_DELAY = 700;

export function EditorShell() {
  const doc = useResumeStore((state) => state.doc);
  const status = useResumeStore((state) => state.status);
  const savedAt = useResumeStore((state) => state.savedAt);
  const hydrate = useResumeStore((state) => state.hydrate);
  const persist = useResumeStore((state) => state.persist);
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);
  const past = useResumeStore((state) => state.past);
  const future = useResumeStore((state) => state.future);
  const updateSection = useResumeStore((state) => state.updateSection);
  const setDocumentName = useResumeStore((state) => state.setDocumentName);
  const loadSample = useResumeStore((state) => state.loadSample);
  const resetToBlank = useResumeStore((state) => state.resetToBlank);
  const clearStored = useResumeStore((state) => state.clearStored);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<AiTarget | null>(null);
  const [designDrawer, setDesignDrawer] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "canvas">("canvas");
  const [hydrated, setHydrated] = useState(false);
  const [pageCount, setPageCount] = useState(1);

  const isWide = useMediaQuery("(min-width: 1280px)", true);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const template = getTemplate(doc.meta.templateId);
  const firstRender = useRef(true);

  useEffect(() => {
    hydrate();
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") resetToBlank();
    if (params.get("import") === "1") setImportOpen(true);
  }, [hydrate, resetToBlank]);

  // Debounced autosave to localStorage.
  useEffect(() => {
    if (!hydrated) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => persist(), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [doc, hydrated, persist]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        persist();
        toast.success("Saved in this browser.");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [persist, redo, undo]);

  const openAi = useCallback((target: AiTarget | null) => {
    setAiTarget(target);
    setAiOpen(true);
  }, []);

  const handleApply = useCallback(
    ({ sectionId, itemId, mode, text, bullets }: { sectionId: string; itemId?: string; mode: "text" | "bullets"; text: string; bullets: string[] }) => {
      updateSection(sectionId, (section) => {
        if (mode === "text") {
          if (section.kind === "summary") section.data.text = text;
          return;
        }
        if (section.kind === "experience" || section.kind === "volunteer" || section.kind === "projects") {
          const items = section.data.items as { id: string; bullets: string[] }[];
          const target = items.find((item) => item.id === itemId) ?? items[0];
          if (target) target.bullets = bullets;
        }
      });
    },
    [updateSection],
  );

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${doc.meta.name.replace(/[^\w-]+/g, "-").toLowerCase() || "resume"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Resume data exported as JSON.");
  };

  const importJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const { resumeDocumentSchema } = await import("@/lib/resume/schema/resume");
        const result = resumeDocumentSchema.safeParse(parsed);
        if (!result.success) {
          toast.error("That JSON is not a valid resume file.");
          return;
        }
        useResumeStore.getState().setDoc(result.data as typeof doc);
        toast.success("Resume imported.");
      } catch {
        toast.error("Could not read that file.");
      }
    };
    input.click();
  };

  const saveLabel =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? savedAt
          ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Saved"
        : status === "error"
          ? "Not saved"
          : "Autosaves locally";

  // The document is client state (ids and timestamps are generated at runtime), so
  // the editor only renders after mount. The server sends a matching skeleton
  // instead of markup that would immediately hydrate into something different.
  if (!hydrated) return <EditorSkeleton />;

  return (
    <TooltipProvider>
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas">
        {/* toolbar */}
        <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-surface px-2.5 sm:px-3">
          <Tooltip label="Back to site">
            <Link href="/" className="grid size-8 place-items-center rounded-[5px] text-subtle hover:bg-surface-2 hover:text-ink">
              <ArrowLeft className="size-4" />
            </Link>
          </Tooltip>

          <div className="flex min-w-0 items-center gap-2">
            <input
              value={doc.meta.name}
              onChange={(event) => setDocumentName(event.target.value)}
              aria-label="Resume name"
              className="w-[110px] min-w-0 truncate rounded-[4px] border border-transparent px-1.5 py-1 text-[13px] font-medium text-ink hover:border-line focus-visible:border-accent focus-visible:outline-none sm:w-[190px]"
            />
            <span className="hidden items-center gap-1 text-[11px] text-subtle sm:flex">
              {status === "saving" ? <Loader2 className="size-3 animate-spin" /> : status === "error" ? <AlertCircle className="size-3 text-danger" /> : <Cloud className="size-3" />}
              {saveLabel}
            </span>
          </div>

          <div className="ml-1 hidden items-center gap-0.5 md:flex">
            <Tooltip label="Undo (⌘Z)">
              <button
                type="button"
                onClick={undo}
                disabled={past.length === 0}
                className="grid size-7.5 place-items-center rounded-[4px] text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-35"
                aria-label="Undo"
              >
                <Undo2 className="size-3.5" />
              </button>
            </Tooltip>
            <Tooltip label="Redo (⌘⇧Z)">
              <button
                type="button"
                onClick={redo}
                disabled={future.length === 0}
                className="grid size-7.5 place-items-center rounded-[4px] text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-35"
                aria-label="Redo"
              >
                <Redo2 className="size-3.5" />
              </button>
            </Tooltip>
          </div>

          <div className="mx-auto hidden items-center gap-1 lg:flex">
            <Button variant="ghost" size="sm" onClick={() => setTemplateOpen(true)}>
              <LayoutTemplate className="size-3.5" /> {template.name}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="size-3.5" /> Preview
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" /> Import
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Badge tone="neutral" className="hidden md:inline-flex">
              {pageCount} {pageCount === 1 ? "page" : "pages"}
            </Badge>
            {!isWide ? (
              <Tooltip label="Design & layout">
                <button
                  type="button"
                  onClick={() => setDesignDrawer(true)}
                  className="grid size-8 place-items-center rounded-[5px] text-subtle hover:bg-surface-2 hover:text-ink"
                  aria-label="Design and layout"
                >
                  <SlidersHorizontal className="size-4" />
                </button>
              </Tooltip>
            ) : null}
            <Button variant={aiOpen ? "subtle" : "ghost"} size="sm" onClick={() => openAi(aiTarget ?? null)}>
              <Sparkles className="size-3.5" /> AI
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="grid size-8 place-items-center rounded-[5px] text-subtle hover:bg-surface-2 hover:text-ink" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Document</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setTemplateOpen(true)}>
                  <LayoutTemplate /> Change template
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                  <Upload /> Import resume
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
                  <Eye /> Full preview
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={downloadJson}>
                  <FileJson /> Export data (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={importJson}>
                  <FileText /> Import data (.json)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { loadSample(); toast.success("Sample content loaded — replace it with your own."); }}>
                  <Sparkles /> Load sample content
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (!window.confirm("Start over with a blank resume? Your current content stays in this browser's autosave until you edit again.")) return;
                    resetToBlank();
                  }}
                >
                  <RotateCcw /> Start over
                </DropdownMenuItem>
                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    if (!window.confirm("Delete the locally saved resume from this browser? This cannot be undone.")) return;
                    clearStored();
                    resetToBlank();
                    toast.success("Local resume deleted.");
                  }}
                >
                  Delete local data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="primary" size="sm" onClick={() => window.open("/print", "_blank", "noopener")}>
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className={cn("min-h-0 w-full shrink-0 border-r border-line bg-surface lg:w-[340px]", !isDesktop && mobileTab !== "content" && "hidden", isDesktop && "flex")}>
            <ContentPanel onAi={(payload) => openAi(payload)} />
          </aside>

          <main className={cn("relative min-w-0 flex-1", !isDesktop && mobileTab !== "canvas" && "hidden")}>
            <CanvasPanel onPageCount={setPageCount} />
          </main>

          {isWide ? (
            <aside className="hidden w-[306px] shrink-0 border-l border-line bg-surface xl:flex xl:flex-col">
              <DesignPanel onChangeTemplate={() => setTemplateOpen(true)} />
            </aside>
          ) : null}
        </div>

        {/* mobile tabs */}
        {!isDesktop ? (
          <nav className="flex h-12 shrink-0 items-center justify-center gap-1 border-t border-line bg-surface">
            {(
              [
                ["content", "Content", FileText],
                ["canvas", "Resume", PanelsTopLeft],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMobileTab(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  mobileTab === value ? "bg-accent-soft text-accent-ink" : "text-subtle",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDesignDrawer(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-subtle"
            >
              <SlidersHorizontal className="size-3.5" /> Design
            </button>
          </nav>
        ) : null}

        {/* design drawer */}
        {designDrawer && !isWide ? (
          <div className="fixed inset-0 z-40 flex justify-end bg-ink/25" onClick={() => setDesignDrawer(false)}>
            <div className="h-full w-[320px] max-w-full bg-surface shadow-[var(--shadow-pop)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="text-[12.5px] font-semibold">Design & layout</span>
                <button type="button" onClick={() => setDesignDrawer(false)} className="rounded p-1 text-subtle hover:bg-surface-2" aria-label="Close">
                  <Check className="size-4" />
                </button>
              </div>
              <div className="h-[calc(100%-41px)]">
                <DesignPanel onChangeTemplate={() => { setDesignDrawer(false); setTemplateOpen(true); }} />
              </div>
            </div>
          </div>
        ) : null}

        {/* AI drawer */}
        {aiOpen ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-ink/25" onClick={() => setAiOpen(false)}>
            <div className="h-full w-full max-w-[400px] bg-surface shadow-[var(--shadow-pop)]" onClick={(event) => event.stopPropagation()}>
              <AiPanel target={aiTarget} onClose={() => setAiOpen(false)} onApply={handleApply} />
            </div>
          </div>
        ) : null}

        {/* preview overlay */}
        {previewOpen ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#3a3d42]">
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 px-3 text-white">
              <span className="text-[12.5px] font-medium">Preview · {doc.meta.name}</span>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => window.open("/print", "_blank", "noopener")}>
                  <Download className="size-3.5" /> Print / PDF
                </Button>
                <button type="button" onClick={() => setPreviewOpen(false)} className="rounded px-2 py-1 text-[12.5px] text-white/80 hover:bg-white/10">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-4 pb-8">
              <div className="mx-auto w-fit" style={{ transform: "scale(0.86)", transformOrigin: "top center" }}>
                <ResumeCanvas doc={doc} template={template} mode="paged" zoom={1} />
              </div>
            </div>
          </div>
        ) : null}

        <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </div>
    </TooltipProvider>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas" aria-busy="true" aria-label="Loading the resume editor">
      <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
        <div className="size-8 rounded-[5px] bg-surface-2" />
        <div className="h-4 w-32 rounded-[3px] bg-surface-2" />
        <div className="ml-auto h-8 w-28 rounded-[5px] bg-surface-2" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_320px] max-lg:grid-cols-1">
        <div className="hidden space-y-2 border-r border-line bg-surface p-3 lg:block">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="h-9 rounded-[5px] bg-surface-2" />
          ))}
        </div>
        <div className="grid place-items-center bg-canvas p-6">
          <div className="aspect-[1/1.414] w-full max-w-[520px] rounded-[2px] border border-line bg-white shadow-[var(--shadow-card)]" />
        </div>
        <div className="hidden space-y-2 border-l border-line bg-surface p-3 lg:block">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 rounded-[5px] bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
