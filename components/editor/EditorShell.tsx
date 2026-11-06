
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  Loader2,
  AlertCircle,
  X,
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
import {
  Tooltip,
  TooltipProvider,
  Badge,
} from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";

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

  const [contentDrawer, setContentDrawer] = useState(false);
  const [designDrawer, setDesignDrawer] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [pageCount, setPageCount] = useState(1);

  const template = getTemplate(doc.meta.templateId);
  const firstRender = useRef(true);

  // Initialize editor.
  useEffect(() => {
    hydrate();
    setHydrated(true);

    const params = new URLSearchParams(window.location.search);

    if (params.get("new") === "1") {
      resetToBlank();
    }

    if (params.get("import") === "1") {
      setImportOpen(true);
    }
  }, [hydrate, resetToBlank]);

  // Autosave.
  useEffect(() => {
    if (!hydrated) return;

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      persist();
    }, AUTOSAVE_DELAY);

    return () => window.clearTimeout(timer);
  }, [doc, hydrated, persist]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;

      if (!meta) return;

      const key = event.key.toLowerCase();

      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (
        (key === "z" && event.shiftKey) ||
        key === "y"
      ) {
        event.preventDefault();
        redo();
      } else if (key === "s") {
        event.preventDefault();
        persist();
        toast.success("Saved in this browser.");
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [persist, redo, undo]);

  // Open AI panel.
  const openAi = useCallback((target: AiTarget | null) => {
    setAiTarget(target);
    setContentDrawer(false);
    setDesignDrawer(false);
    setAiOpen(true);
  }, []);

  // Apply AI-generated content.
  const handleApply = useCallback(
    ({
      sectionId,
      itemId,
      mode,
      text,
      bullets,
    }: {
      sectionId: string;
      itemId?: string;
      mode: "text" | "bullets";
      text: string;
      bullets: string[];
    }) => {
      updateSection(sectionId, (section) => {
        if (mode === "text") {
          if (section.kind === "summary") {
            section.data.text = text;
          }

          return;
        }

        if (
          section.kind === "experience" ||
          section.kind === "volunteer" ||
          section.kind === "projects"
        ) {
          const items = section.data.items as {
            id: string;
            bullets: string[];
          }[];

          const target =
            items.find((item) => item.id === itemId) ??
            items[0];

          if (target) {
            target.bullets = bullets;
          }
        }
      });
    },
    [updateSection]
  );

  // Export resume JSON.
  const downloadJson = () => {
    const blob = new Blob(
      [JSON.stringify(doc, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      `${doc.meta.name.replace(/[^\w-]+/g, "-").toLowerCase() || "resume"}.json`;

    anchor.click();
    URL.revokeObjectURL(url);

    toast.success("Resume data exported as JSON.");
  };

  // Import resume JSON.
  const importJson = () => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) return;

      try {
        const parsed = JSON.parse(await file.text());

        const { resumeDocumentSchema } = await import(
          "@/lib/resume/schema/resume"
        );

        const result = resumeDocumentSchema.safeParse(parsed);

        if (!result.success) {
          toast.error("That JSON is not a valid resume file.");
          return;
        }

        useResumeStore
          .getState()
          .setDoc(result.data as typeof doc);

        toast.success("Resume imported.");
      } catch {
        toast.error("Could not read that file.");
      }
    };

    input.click();
  };

  // Autosave label.
  const saveLabel =
    status === "saving"
      ? "Saving changes..."
      : status === "saved"
        ? savedAt
          ? `Saved ${new Date(savedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Saved"
        : status === "error"
          ? "Not saved"
          : "Autosaved locally";

  if (!hydrated) {
    return <EditorSkeleton />;
  }

  return (
    <TooltipProvider>
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#efede7]">

        {/* TOP TOOLBAR */}
        <header className="relative z-30 flex h-[62px] shrink-0 items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-3 sm:px-5">

          {/* Left side */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">

            <Tooltip label="Back to website">
              <Link
                href="/"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <ArrowLeft className="size-[18px]" />
              </Link>
            </Tooltip>

            <div className="h-7 w-px shrink-0 bg-line" />

            <div className="flex min-w-0 flex-col justify-center gap-0.5">
              <input
                value={doc.meta.name}
                onChange={(event) =>
                  setDocumentName(event.target.value)
                }
                aria-label="Resume name"
                className="w-[105px] truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-semibold text-ink outline-none transition-colors hover:border-line focus-visible:border-accent sm:w-[180px]"
              />

              <span className="flex items-center gap-1.5 px-1 text-[10px] text-subtle">
                {status === "saving" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : status === "error" ? (
                  <AlertCircle className="size-3 text-danger" />
                ) : (
                  <Cloud className="size-3" />
                )}

                <span className="hidden sm:inline">
                  {saveLabel}
                </span>
              </span>
            </div>

            <div className="ml-1 hidden items-center gap-1 border-l border-line pl-2 sm:flex">
              <Tooltip label="Undo (Ctrl + Z)">
                <button
                  type="button"
                  onClick={undo}
                  disabled={past.length === 0}
                  aria-label="Undo"
                  className="grid size-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                >
                  <Undo2 className="size-4" />
                </button>
              </Tooltip>

              <Tooltip label="Redo (Ctrl + Shift + Z)">
                <button
                  type="button"
                  onClick={redo}
                  disabled={future.length === 0}
                  aria-label="Redo"
                  className="grid size-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                >
                  <Redo2 className="size-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Center actions */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTemplateOpen(true)}
              className="gap-2 text-[12px]"
            >
              <LayoutTemplate className="size-4" />
              <span>{template.name}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="gap-2 text-[12px]"
            >
              <Eye className="size-4" />
              Preview
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="gap-2 text-[12px]"
            >
              <Upload className="size-4" />
              Import
            </Button>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">

            <Badge tone="neutral" className="hidden md:inline-flex">
              {pageCount} {pageCount === 1 ? "page" : "pages"}
            </Badge>

            <Tooltip label="Edit content">
              <button
                type="button"
                onClick={() => {
                  setContentDrawer(true);
                  setDesignDrawer(false);
                }}
                aria-label="Open content editor"
                className="grid size-9 place-items-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <FileText className="size-[17px]" />
              </button>
            </Tooltip>

            <Tooltip label="Design settings">
              <button
                type="button"
                onClick={() => {
                  setDesignDrawer(true);
                  setContentDrawer(false);
                }}
                aria-label="Open design settings"
                className="grid size-9 place-items-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <SlidersHorizontal className="size-[17px]" />
              </button>
            </Tooltip>

            <Button
              variant={aiOpen ? "subtle" : "ghost"}
              size="sm"
              onClick={() => openAi(aiTarget)}
              className="gap-1.5"
            >
              <Sparkles className="size-4" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="sm:hidden">AI</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More document actions"
                  className="grid size-9 place-items-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <MoreHorizontal className="size-[18px]" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Resume options
                </DropdownMenuLabel>

                <DropdownMenuItem onSelect={() => setTemplateOpen(true)}>
                  <LayoutTemplate />
                  Change template
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                  <Upload />
                  Import resume
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
                  <Eye />
                  Full preview
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={downloadJson}>
                  <FileJson />
                  Export data (.json)
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={importJson}>
                  <FileText />
                  Import data (.json)
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={() => {
                    loadSample();
                    toast.success("Sample content loaded — replace it with your own.");
                  }}
                >
                  <Sparkles />
                  Load sample content
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => {
                    if (!window.confirm("Start over with a blank resume?")) {
                      return;
                    }

                    resetToBlank();
                  }}
                >
                  <RotateCcw />
                  Start with blank resume
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    if (
                      !window.confirm(
                        "Delete the locally saved resume from this browser? This cannot be undone."
                      )
                    ) {
                      return;
                    }

                    clearStored();
                    resetToBlank();
                    toast.success("Local resume data cleared.");
                  }}
                >
                  <RotateCcw />
                  Delete local data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                window.open("/print", "_blank", "noopener")
              }
              className="h-9 gap-1.5 px-3 sm:px-4"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </header>

        {/* CANVAS WORKSPACE */}
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#efede7]">

          <CanvasPanel
            onPageCount={setPageCount}
            onUndo={undo}
            onRedo={redo}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onOpenContent={() => {
              setContentDrawer(true);
              setDesignDrawer(false);
            }}
            onOpenDesign={() => {
              setDesignDrawer(true);
              setContentDrawer(false);
            }}
          />
        </main>

        {/* CONTENT DRAWER */}
        {contentDrawer && (
          <div
            className="fixed inset-0 z-40 flex bg-black/30 backdrop-blur-[2px]"
            onClick={() => setContentDrawer(false)}
          >
            <div
              className="editor-drawer flex h-full w-[380px] max-w-[92vw] flex-col border-r border-line bg-surface shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Resume content
                  </p>
                  <p className="text-[11px] text-subtle">
                    Edit your information and sections
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setContentDrawer(false)}
                  aria-label="Close content editor"
                  className="grid size-9 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <ContentPanel
                  onAi={(payload) => openAi(payload)}
                />
              </div>
            </div>
          </div>
        )}

        {/* DESIGN DRAWER */}
        {designDrawer && (
          <div
            className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-[2px]"
            onClick={() => setDesignDrawer(false)}
          >
            <div
              className="editor-drawer flex h-full w-[360px] max-w-[92vw] flex-col border-l border-line bg-surface shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Design settings
                  </p>
                  <p className="text-[11px] text-subtle">
                    Customize your resume
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDesignDrawer(false)}
                  aria-label="Close design settings"
                  className="grid size-9 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <DesignPanel
                  onChangeTemplate={() => {
                    setDesignDrawer(false);
                    setTemplateOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI DRAWER */}
        {aiOpen && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px]"
            onClick={() => setAiOpen(false)}
          >
            <div
              className="h-full w-full max-w-[420px] bg-surface shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <AiPanel
                target={aiTarget}
                onClose={() => setAiOpen(false)}
                onApply={handleApply}
              />
            </div>
          </div>
        )}

        {/* FULL RESUME PREVIEW */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#34373b]">
            <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/10 px-4 text-white sm:px-6">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {doc.meta.name}
                </span>
                <span className="text-[10px] text-white/50">
                  Resume preview
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    window.open("/print", "_blank", "noopener")
                  }
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="grid size-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close preview"
                >
                  <X className="size-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-auto px-3 py-6 sm:px-6">
              <div className="mx-auto w-fit">
                <ResumeCanvas
                  doc={doc}
                  template={template}
                  mode="paged"
                  zoom={0.86}
                />
              </div>
            </div>
          </div>
        )}

        {/* DIALOGS */}
        <TemplateDialog
          open={templateOpen}
          onOpenChange={setTemplateOpen}
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
        />
      </div>
    </TooltipProvider>
  );
}

function EditorSkeleton() {
  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-canvas"
      aria-busy="true"
      aria-label="Loading the resume editor"
    >
      <div className="flex h-[62px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <div className="size-9 rounded-lg bg-surface-2" />
        <div className="h-4 w-32 rounded bg-surface-2" />
        <div className="ml-auto h-8 w-28 rounded-lg bg-surface-2" />
      </div>

      <div className="grid min-h-0 flex-1 place-items-center bg-[#efede7] p-6">
        <div className="aspect-[1/1.414] w-full max-w-[520px] rounded-sm border border-line bg-white shadow-[var(--shadow-card)]" />
      </div>
    </div>
  );
}
