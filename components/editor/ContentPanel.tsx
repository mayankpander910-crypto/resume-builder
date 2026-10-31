"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  UserRound,
  Wand2,
} from "lucide-react";
import type { ResumeSection, SectionKind } from "@/types/resume";
import { SECTION_KIND_LABEL } from "@/types/resume";
import { useResumeStore } from "@/store/resume-store";
import { SectionEditor } from "@/components/editor/SectionEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlay";
import { TwoCol, TextField } from "@/components/editor/fields";
import { cn } from "@/lib/utils/cn";

const ADDABLE: SectionKind[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "achievements",
  "languages",
  "volunteer",
  "publications",
  "interests",
  "references",
  "custom",
];

export interface ContentPanelProps {
  onAi: (payload: { sectionId: string; target: "summary" | "experience" | "project" | "skills" | "education" | "achievement"; text: string; label: string }) => void;
  highlightSectionId?: string | null;
}

export function ContentPanel({ onAi }: ContentPanelProps) {
  const doc = useResumeStore((state) => state.doc);
  const moveSection = useResumeStore((state) => state.moveSection);
  const addSection = useResumeStore((state) => state.addSection);
  const updateBasics = useResumeStore((state) => state.updateBasics);
  const [openId, setOpenId] = useState<string | null>(null);
  const [basicsOpen, setBasicsOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => doc.sections.map((section) => section.id), [doc.sections]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    moveSection(String(active.id), String(over.id));
  };

  const existingKinds = new Set(doc.sections.map((section) => section.kind));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setBasicsOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
            <UserRound className="size-3.5 text-subtle" />
            Personal details
          </span>
          <ChevronDown className={cn("size-3.5 text-subtle transition-transform", !basicsOpen && "-rotate-90")} />
        </button>
        {basicsOpen ? (
          <div className="mt-2.5 space-y-2">
            <TextField label="Full name" value={doc.basics.fullName} onChange={(value) => updateBasics({ fullName: value })} placeholder="Aarav Mehta" />
            <TextField
              label="Headline"
              value={doc.basics.headline}
              onChange={(value) => updateBasics({ headline: value })}
              placeholder="Senior Product Engineer · Platform"
            />
            <TwoCol>
              <TextField label="Email" value={doc.basics.email} onChange={(value) => updateBasics({ email: value })} placeholder="you@mail.com" />
              <TextField label="Phone" value={doc.basics.phone} onChange={(value) => updateBasics({ phone: value })} />
            </TwoCol>
            <TextField label="Location" value={doc.basics.location} onChange={(value) => updateBasics({ location: value })} placeholder="Bengaluru, India" />
            <TwoCol>
              <TextField label="Website" value={doc.basics.website} onChange={(value) => updateBasics({ website: value })} />
              <TextField label="LinkedIn" value={doc.basics.linkedin} onChange={(value) => updateBasics({ linkedin: value })} />
            </TwoCol>
            <TextField label="GitHub" value={doc.basics.github} onChange={(value) => updateBasics({ github: value })} />
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11.5px] text-ink-2">Show a photo</span>
              <Switch
                checked={doc.basics.photoVisible}
                onCheckedChange={(value) => updateBasics({ photoVisible: value })}
                label="Show photo"
              />
            </div>
            <p className="text-[10.5px] leading-snug text-subtle">
              Photos are stored only in your browser. Most US, UK and Canadian applications are stronger without one.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between px-3.5 pb-1.5 pt-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle">Sections</p>
        <span className="text-[10.5px] text-subtle">{doc.sections.length} total</span>
      </div>

      <div className="editor-panel flex-1 overflow-y-auto px-2.5 pb-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {doc.sections.map((section) => (
                <SortableSectionRow
                  key={section.id}
                  section={section}
                  open={openId === section.id}
                  onToggle={() => setOpenId((current) => (current === section.id ? null : section.id))}
                  onAi={onAi}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-center border-dashed">
                <Plus className="size-3.5" /> Add a section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[320px] overflow-y-auto">
              <DropdownMenuLabel>Standard sections</DropdownMenuLabel>
              {ADDABLE.map((kind) => (
                <DropdownMenuItem
                  key={kind}
                  onSelect={() => {
                    const column = doc.layout.columns > 1 && ["skills", "languages", "certifications", "interests"].includes(kind) ? 1 : 0;
                    const id = addSection(kind, column as 0 | 1);
                    setOpenId(id);
                  }}
                >
                  {SECTION_KIND_LABEL[kind]}
                  {existingKinds.has(kind) ? <span className="ml-auto text-[10px] uppercase tracking-wide text-subtle">add</span> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function SortableSectionRow({
  section,
  open,
  onToggle,
  onAi,
}: {
  section: ResumeSection;
  open: boolean;
  onToggle: () => void;
  onAi: ContentPanelProps["onAi"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const store = useResumeStore();
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.title);

  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-[6px] border bg-surface",
        open ? "border-line-strong shadow-[0_1px_2px_rgba(21,23,27,0.05)]" : "border-line",
        isDragging && "z-10 opacity-95 shadow-[var(--shadow-pop)]",
        !section.visible && "opacity-60",
      )}
    >
      <div className="flex items-center gap-0.5 px-1 py-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-subtle/60 hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
          aria-label={`Reorder ${section.title}`}
        >
          <GripVertical className="size-3.5" />
        </button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5 text-left">
          <ChevronDown className={cn("size-3.5 shrink-0 text-subtle transition-transform", !open && "-rotate-90")} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium text-ink">{section.title}</span>
            <span className="block text-[10.5px] text-subtle">
              {SECTION_KIND_LABEL[section.kind]}
              {store.doc.layout.columns > 1 ? ` · column ${section.column === 0 ? "1" : section.column + 1}` : ""}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => store.toggleSection(section.id)}
          className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-ink"
          aria-label={section.visible ? "Hide section" : "Show section"}
          title={section.visible ? "Hide from resume" : "Show in resume"}
        >
          {section.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-ink" aria-label="Section options">
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { setDraftTitle(section.title); setRenaming(true); }}>
              Rename heading
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => store.duplicateSection(section.id)}>
              <Copy /> Duplicate section
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => store.updateSection(section.id, (draft) => { draft.hideTitle = !draft.hideTitle; })}>
              {section.hideTitle ? "Show heading" : "Hide heading"}
            </DropdownMenuItem>
            {store.doc.layout.columns > 1 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Move to column</DropdownMenuLabel>
                {[0, 1, 2].slice(0, store.doc.layout.columns).map((column) => (
                  <DropdownMenuItem key={column} onSelect={() => store.setSectionColumn(section.id, column as 0 | 1 | 2)}>
                    Column {column + 1}
                    {section.column === column ? <span className="ml-auto text-[10px] text-accent">current</span> : null}
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => store.removeSection(section.id)}>
              <Trash2 /> Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {renaming ? (
        <div className="flex items-center gap-1.5 border-t border-line px-2 py-1.5">
          <Input
            autoFocus
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                store.renameSection(section.id, draftTitle.trim() || section.title);
                setRenaming(false);
              }
              if (event.key === "Escape") setRenaming(false);
            }}
            className="h-7 text-[12px]"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              store.renameSection(section.id, draftTitle.trim() || section.title);
              setRenaming(false);
            }}
          >
            Save
          </Button>
        </div>
      ) : null}

      {open ? (
        <div className="border-t border-line px-2 py-2.5">
          <SectionEditor section={section} onAi={onAi} />
          {!section.visible ? (
            <p className="mt-2 flex items-center gap-1.5 rounded-[4px] bg-warn-soft px-2 py-1.5 text-[11px] text-warn">
              <EyeOff className="size-3" /> Hidden — it will not appear in the PDF.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => store.toggleSection(section.id)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-subtle hover:text-accent"
          >
            <Wand2 className="size-3" /> {section.visible ? "Hide this section" : "Show this section"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
