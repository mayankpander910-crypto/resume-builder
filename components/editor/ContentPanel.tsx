
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
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
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
import { Input, Switch } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
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
  onAi: (payload: {
    sectionId: string;
    target:
      | "summary"
      | "experience"
      | "project"
      | "skills"
      | "education"
      | "achievement";
    text: string;
    label: string;
  }) => void;
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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(
    () => doc.sections.map((section) => section.id),
    [doc.sections],
  );

  const existingKinds = new Set(
    doc.sections.map((section) => section.kind),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    moveSection(String(active.id), String(over.id));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-[#e9eaed]">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#20232a]">
              Content
            </h2>
            <p className="mt-0.5 text-[11px] text-[#8a8d96]">
              Edit your resume information
            </p>
          </div>

          <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[10px] font-medium text-[#656a75]">
            {doc.sections.length} sections
          </span>
        </div>

        <button
          type="button"
          onClick={() => setBasicsOpen((value) => !value)}
          aria-expanded={basicsOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[#eef4f3] text-[#176d63]">
              <UserRound className="size-4" />
            </span>

            <span>
              <span className="block text-[12.5px] font-semibold text-[#252832]">
                Personal details
              </span>
              <span className="mt-0.5 block text-[10.5px] text-[#92959d]">
                Name, contact and profile
              </span>
            </span>
          </span>

          <ChevronDown
            className={cn(
              "size-4 text-[#858993] transition-transform duration-200",
              !basicsOpen && "-rotate-90",
            )}
          />
        </button>

        {basicsOpen && (
          <div className="space-y-3 border-t border-[#f0f0f2] px-4 pb-4 pt-3">
            <TextField
              label="Full name"
              value={doc.basics.fullName}
              onChange={(value) => updateBasics({ fullName: value })}
              placeholder="Your full name"
            />

            <TextField
              label="Professional headline"
              value={doc.basics.headline}
              onChange={(value) => updateBasics({ headline: value })}
              placeholder="e.g. Senior Product Designer"
            />

            <TwoCol>
              <TextField
                label="Email"
                value={doc.basics.email}
                onChange={(value) => updateBasics({ email: value })}
                placeholder="you@mail.com"
              />

              <TextField
                label="Phone"
                value={doc.basics.phone}
                onChange={(value) => updateBasics({ phone: value })}
                placeholder="+1 234 567 890"
              />
            </TwoCol>

            <TextField
              label="Location"
              value={doc.basics.location}
              onChange={(value) => updateBasics({ location: value })}
              placeholder="City, Country"
            />

            <TwoCol>
              <TextField
                label="Website"
                value={doc.basics.website}
                onChange={(value) => updateBasics({ website: value })}
                placeholder="yourwebsite.com"
              />

              <TextField
                label="LinkedIn"
                value={doc.basics.linkedin}
                onChange={(value) => updateBasics({ linkedin: value })}
                placeholder="LinkedIn URL"
              />
            </TwoCol>

            <TextField
              label="GitHub"
              value={doc.basics.github}
              onChange={(value) => updateBasics({ github: value })}
              placeholder="GitHub URL"
            />

            <div className="flex items-center justify-between rounded-lg border border-[#ededf0] px-3 py-2.5">
              <span className="text-[11.5px] font-medium text-[#4c505a]">
                Show profile photo
              </span>

              <Switch
                checked={doc.basics.photoVisible}
                onCheckedChange={(value) =>
                  updateBasics({ photoVisible: value })
                }
                label="Show photo"
              />
            </div>

            <p className="text-[10.5px] leading-relaxed text-[#92959d]">
              Your photo is stored only in your browser. You can turn it off
              whenever you want.
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h3 className="text-[12px] font-semibold text-[#252832]">
            Resume sections
          </h3>
          <p className="mt-0.5 text-[10.5px] text-[#92959d]">
            Drag to change their order
          </p>
        </div>

        <span className="text-[10.5px] font-medium tabular-nums text-[#8c9099]">
          {doc.sections.length} total
        </span>
      </div>

      <div className="editor-panel min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[
            restrictToVerticalAxis,
            restrictToParentElement,
          ]}
        >
          <SortableContext
            items={ids}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {doc.sections.map((section) => (
                <SortableSectionRow
                  key={section.id}
                  section={section}
                  open={openId === section.id}
                  onToggle={() =>
                    setOpenId((current) =>
                      current === section.id ? null : section.id,
                    )
                  }
                  onAi={onAi}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full justify-center gap-2 rounded-lg border-dashed border-[#cdd6d4] bg-[#f9fbfa] text-[12px] font-semibold text-[#176d63] hover:border-[#176d63] hover:bg-[#eff6f4]"
              >
                <Plus className="size-4" />
                Add a section
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="max-h-[320px] w-[260px] overflow-y-auto rounded-xl p-1.5"
            >
              <div className="px-2 py-2 text-[10px] uppercase tracking-wider text-[#92959d]">
                <DropdownMenuLabel>Choose a section</DropdownMenuLabel>
              </div>

              {ADDABLE.map((kind) => (
                <DropdownMenuItem
                  key={kind}
                  onSelect={() => {
                    const column =
                      doc.layout.columns > 1 &&
                      [
                        "skills",
                        "languages",
                        "certifications",
                        "interests",
                      ].includes(kind)
                        ? 1
                        : 0;

                    const id = addSection(
                      kind,
                      column as 0 | 1,
                    );

                    setOpenId(id);
                  }}
                  className="flex min-h-9 items-center justify-between rounded-lg px-2.5 text-[12px]"
                >
                  <span>{SECTION_KIND_LABEL[kind]}</span>

                  {existingKinds.has(kind) && (
                    <span className="text-[9px] font-medium uppercase tracking-wide text-[#999da5]">
                      Add another
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 rounded-lg bg-[#f7f8f9] px-3 py-3">
          <p className="text-[10.5px] font-semibold text-[#555a64]">
            Make your resume stand out
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#92959d]">
            Add relevant experience, measurable achievements and skills
            to make your profile more informative.
          </p>
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const store = useResumeStore();

  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.title);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-xl border bg-white transition-all duration-150",
        open
          ? "border-[#b9d0ca] shadow-[0_2px_8px_rgba(24,75,66,0.06)]"
          : "border-[#e9eaed] hover:border-[#cfd5d7]",
        isDragging &&
          "z-10 opacity-95 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        !section.visible && "opacity-60",
      )}
    >
      <div className="flex min-h-[58px] items-center gap-1 px-1.5 py-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-[#a2a5ad] transition-colors hover:bg-[#f1f2f4] hover:text-[#555a64] active:cursor-grabbing"
          aria-label={`Reorder ${section.title}`}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-[#969aa3] transition-transform duration-200",
              !open && "-rotate-90",
            )}
          />

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-[#292d36]">
              {section.title}
            </span>

            <span className="mt-0.5 block truncate text-[10px] text-[#9397a0]">
              {SECTION_KIND_LABEL[section.kind]}
              {store.doc.layout.columns > 1
                ? ` · Column ${(section.column ?? 0) + 1}`
                : ""}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => store.toggleSection(section.id)}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md transition-colors",
            section.visible
              ? "text-[#858b94] hover:bg-[#f1f2f4] hover:text-[#176d63]"
              : "bg-[#fff4e7] text-[#b87927]",
          )}
          aria-label={section.visible ? "Hide section" : "Show section"}
          title={section.visible ? "Hide from resume" : "Show in resume"}
        >
          {section.visible ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-md text-[#9296a0] transition-colors hover:bg-[#f1f2f4] hover:text-[#353943]"
              aria-label="Section options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl p-1.5"
          >
            <DropdownMenuLabel>
              <span className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-[#999da5]">
                Section options
              </span>
            </DropdownMenuLabel>

            <DropdownMenuItem
              onSelect={() => {
                setDraftTitle(section.title);
                setRenaming(true);
              }}
            >
              Rename heading
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => store.duplicateSection(section.id)}
            >
              <Copy />
              Duplicate section
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() =>
                store.updateSection(section.id, (draft) => {
                  draft.hideTitle = !draft.hideTitle;
                })
              }
            >
              {section.hideTitle ? "Show heading" : "Hide heading"}
            </DropdownMenuItem>

            {store.doc.layout.columns > 1 && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuLabel>
                  Move to column
                </DropdownMenuLabel>

                {[0, 1, 2]
                  .slice(0, store.doc.layout.columns)
                  .map((column) => (
                    <DropdownMenuItem
                      key={column}
                      onSelect={() =>
                        store.setSectionColumn(
                          section.id,
                          column as 0 | 1 | 2,
                        )
                      }
                    >
                      Column {column + 1}

                      {section.column === column && (
                        <span className="ml-auto text-[10px] text-[#176d63]">
                          Current
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              destructive
              onSelect={() => store.removeSection(section.id)}
            >
              <Trash2 />
              Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {renaming && (
        <div className="flex items-center gap-2 border-t border-[#ededf0] bg-[#fafafa] px-3 py-2">
          <Input
            autoFocus
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                store.renameSection(
                  section.id,
                  draftTitle.trim() || section.title,
                );
                setRenaming(false);
              }

              if (event.key === "Escape") {
                setRenaming(false);
              }
            }}
            className="h-8 rounded-lg text-[12px]"
          />

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              store.renameSection(
                section.id,
                draftTitle.trim() || section.title,
              );
              setRenaming(false);
            }}
          >
            Save
          </Button>
        </div>
      )}

      {open && (
        <div className="border-t border-[#ededf0] bg-[#fcfcfd] px-3 py-3">
          <SectionEditor section={section} onAi={onAi} />

          {!section.visible && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#fff5e9] px-3 py-2 text-[10.5px] text-[#a36d2d]">
              <EyeOff className="size-3.5 shrink-0" />
              Hidden — this section will not appear in your PDF.
            </p>
          )}

          <button
            type="button"
            onClick={() => store.toggleSection(section.id)}
            className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#777d87] transition-colors hover:text-[#176d63]"
          >
            <Wand2 className="size-3.5" />
            {section.visible
              ? "Hide this section from resume"
              : "Show this section in resume"}
          </button>
        </div>
      )}
    </div>
  );
}
