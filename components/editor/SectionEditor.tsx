"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type {
  CertificationItem,
  CustomItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  PublicationItem,
  ResumeSection,
} from "@/types/resume";
import { useResumeStore } from "@/store/resume-store";
import { createId } from "@/lib/resume/schema/factory";
import { AreaField, BulletEditor, ItemCard, ListField, TextField, TwoCol } from "@/components/editor/fields";
import { Switch } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AiRequest = (payload: { sectionId: string; target: "summary" | "experience" | "project" | "skills" | "education" | "achievement"; text: string; label: string }) => void;

interface Props {
  section: ResumeSection;
  onAi?: AiRequest;
}

const mutators = () => useResumeStore.getState();

export function SectionEditor({ section, onAi }: Props) {
  const updateSection = useResumeStore((state) => state.updateSection);

  const mutate = (recipe: (draft: ResumeSection) => void, historyKey?: string) => {
    updateSection(section.id, recipe as never, historyKey ? { historyKey } : undefined);
  };

  switch (section.kind) {
    case "summary":
      return (
        <div className="space-y-2">
          <AreaField
            label="Summary"
            value={section.data.text}
            onChange={(value) => mutate((draft) => {
              if (draft.kind === "summary") draft.data.text = value;
            }, `summary:${section.id}`)}
            rows={5}
            placeholder="Two to four lines: what you do, where your depth is, and the kind of problem you want next."
            hint={`${section.data.text.trim() ? section.data.text.trim().split(/\s+/).length : 0} words · aim for 35–80`}
          />
          {onAi ? (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => onAi({ sectionId: section.id, target: "summary", text: section.data.text, label: "Professional summary" })}
            >
              <Sparkles className="size-3.5" /> Improve with AI
            </Button>
          ) : null}
        </div>
      );

    case "experience":
    case "volunteer":
      return <ExperienceEditor section={section} onAi={onAi} />;

    case "education":
      return <EducationEditor section={section} />;

    case "projects":
      return <ProjectsEditor section={section} onAi={onAi} />;

    case "skills":
      return (
        <div className="space-y-2.5">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">Display</p>
            <Select
              value={section.data.display}
              onValueChange={(value) =>
                mutate((draft) => {
                  if (draft.kind === "skills") draft.data.display = value as "list" | "inline" | "chips" | "bars";
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inline">Inline · grouped with labels</SelectItem>
                <SelectItem value="list">List · label then comma list</SelectItem>
                <SelectItem value="chips">Chips · boxed tags</SelectItem>
                <SelectItem value="bars">Two-column keylines</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {section.data.groups.map((group, groupIndex) => (
            <div key={group.id} className="space-y-2 rounded-[6px] border border-line p-2">
              <div className="flex items-end gap-1.5">
                <div className="flex-1">
                  <TextField
                    label="Group name"
                    value={group.name}
                    onChange={(value) =>
                      mutate((draft) => {
                        if (draft.kind === "skills") draft.data.groups[groupIndex].name = value;
                      }, `skill-name:${group.id}`)
                    }
                    placeholder="Languages"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove group"
                  onClick={() =>
                    mutate((draft) => {
                      if (draft.kind === "skills") draft.data.groups = draft.data.groups.filter((g) => g.id !== group.id);
                    })
                  }
                >
                  ×
                </Button>
              </div>
              <ListField
                label="Skills"
                value={group.items}
                onChange={(items) =>
                  mutate((draft) => {
                    if (draft.kind === "skills") draft.data.groups[groupIndex].items = items;
                  }, `skill-items:${group.id}`)
                }
                placeholder="TypeScript, React, PostgreSQL"
                hint="Separate with commas."
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() =>
              mutate((draft) => {
                if (draft.kind === "skills") draft.data.groups.push({ id: createId("grp"), name: "New group", items: [] });
              })
            }
          >
            Add skill group
          </Button>
        </div>
      );

    case "certifications":
      return (
        <ItemListEditor<CertificationItem>
          items={section.data.items}
          onChange={(items) =>
            mutate((draft) => {
              if (draft.kind === "certifications") draft.data.items = items;
            }, `certs:${section.id}`)
          }
          factory={() => ({ id: createId("cert"), name: "", issuer: "", date: "", url: "" })}
          labelOf={(item) => item.name}
          addLabel="Add certification"
          render={(item, patch) => (
            <>
              <TextField label="Certificate" value={item.name} onChange={(value) => patch({ name: value })} placeholder="AWS Solutions Architect" />
              <TwoCol>
                <TextField label="Issuer" value={item.issuer} onChange={(value) => patch({ issuer: value })} />
                <TextField label="Date" value={item.date} onChange={(value) => patch({ date: value })} placeholder="2024" />
              </TwoCol>
            </>
          )}
        />
      );

    case "achievements":
      return (
        <ItemListEditor
          items={section.data.items}
          onChange={(items) =>
            mutate((draft) => {
              if (draft.kind === "achievements") draft.data.items = items;
            }, `ach:${section.id}`)
          }
          factory={() => ({ id: createId("ach"), title: "", issuer: "", date: "", description: "" })}
          labelOf={(item) => item.title}
          addLabel="Add achievement"
          render={(item, patch) => (
            <>
              <TextField label="Achievement" value={item.title} onChange={(value) => patch({ title: value })} />
              <TwoCol>
                <TextField label="Awarded by" value={item.issuer} onChange={(value) => patch({ issuer: value })} />
                <TextField label="Date" value={item.date} onChange={(value) => patch({ date: value })} />
              </TwoCol>
              <AreaField label="Detail" value={item.description} onChange={(value) => patch({ description: value })} rows={2} />
            </>
          )}
        />
      );

    case "languages":
      return (
        <div className="space-y-2.5">
          <Select
            value={section.data.display}
            onValueChange={(value) =>
              mutate((draft) => {
                if (draft.kind === "languages") draft.data.display = value as "list" | "inline" | "dots";
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inline">Inline</SelectItem>
              <SelectItem value="list">Name · level</SelectItem>
              <SelectItem value="dots">Level dots</SelectItem>
            </SelectContent>
          </Select>
          <ItemListEditor<LanguageItem>
            items={section.data.items}
            onChange={(items) =>
              mutate((draft) => {
                if (draft.kind === "languages") draft.data.items = items;
              }, `lang:${section.id}`)
            }
            factory={() => ({ id: createId("lang"), name: "", proficiency: "Fluent" })}
            labelOf={(item) => item.name}
            addLabel="Add language"
            render={(item, patch) => (
              <TwoCol>
                <TextField label="Language" value={item.name} onChange={(value) => patch({ name: value })} />
                <TextField label="Level" value={item.proficiency} onChange={(value) => patch({ proficiency: value })} placeholder="Fluent" />
              </TwoCol>
            )}
          />
        </div>
      );

    case "publications":
      return (
        <ItemListEditor<PublicationItem>
          items={section.data.items}
          onChange={(items) =>
            mutate((draft) => {
              if (draft.kind === "publications") draft.data.items = items;
            }, `pub:${section.id}`)
          }
          factory={() => ({ id: createId("pub"), title: "", venue: "", date: "", url: "", authors: "" })}
          labelOf={(item) => item.title}
          addLabel="Add publication"
          render={(item, patch) => (
            <>
              <TextField label="Title" value={item.title} onChange={(value) => patch({ title: value })} />
              <TextField label="Authors" value={item.authors} onChange={(value) => patch({ authors: value })} />
              <TwoCol>
                <TextField label="Venue" value={item.venue} onChange={(value) => patch({ venue: value })} />
                <TextField label="Year" value={item.date} onChange={(value) => patch({ date: value })} />
              </TwoCol>
            </>
          )}
        />
      );

    case "interests":
      return (
        <ListField
          label="Interests"
          value={section.data.items}
          onChange={(items) =>
            mutate((draft) => {
              if (draft.kind === "interests") draft.data.items = items;
            }, `interests:${section.id}`)
          }
          placeholder="Trail running, analog photography"
        />
      );

    case "references":
      return (
        <ItemListEditor
          items={section.data.items}
          onChange={(items) =>
            mutate((draft) => {
              if (draft.kind === "references") draft.data.items = items;
            }, `refs:${section.id}`)
          }
          factory={() => ({ id: createId("ref"), name: "", role: "", contact: "" })}
          labelOf={(item) => item.name}
          addLabel="Add reference"
          render={(item, patch) => (
            <>
              <TextField label="Name" value={item.name} onChange={(value) => patch({ name: value })} />
              <TextField label="Role and company" value={item.role} onChange={(value) => patch({ role: value })} />
              <TextField label="Contact" value={item.contact} onChange={(value) => patch({ contact: value })} />
            </>
          )}
        />
      );

    case "custom":
      return (
        <ItemListEditor<CustomItem>
          items={section.data.items}
          onChange={(items) =>
            mutate((draft) => {
              if (draft.kind === "custom") draft.data.items = items;
            }, `custom:${section.id}`)
          }
          factory={() => ({ id: createId("cus"), heading: "", subheading: "", date: "", bullets: [""] })}
          labelOf={(item) => item.heading}
          addLabel="Add entry"
          render={(item, patch) => (
            <>
              <TextField label="Heading" value={item.heading} onChange={(value) => patch({ heading: value })} />
              <TwoCol>
                <TextField label="Subheading" value={item.subheading} onChange={(value) => patch({ subheading: value })} />
                <TextField label="Date" value={item.date} onChange={(value) => patch({ date: value })} />
              </TwoCol>
              <BulletEditor bullets={item.bullets} onChange={(bullets) => patch({ bullets })} />
            </>
          )}
        />
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ helpers */

function useItemOpener() {
  const [openId, setOpenId] = useState<string | null>(null);
  return {
    openId,
    isOpen: (id: string) => openId === id,
    toggle: (id: string) => setOpenId((current) => (current === id ? null : id)),
    open: (id: string) => setOpenId(id),
  };
}

function ItemListEditor<T extends { id: string }>({
  items,
  onChange,
  factory,
  labelOf,
  render,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  factory: () => T;
  labelOf: (item: T) => string;
  render: (item: T, patch: (partial: Partial<T>) => void) => React.ReactNode;
  addLabel: string;
}) {
  const opener = useItemOpener();

  const patchAt = (id: string, partial: Partial<T>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={labelOf(item)}
          open={opener.isOpen(item.id)}
          onToggle={() => opener.toggle(item.id)}
          onRemove={() => onChange(items.filter((entry) => entry.id !== item.id))}
          onDuplicate={() => {
            const copy = { ...item, id: createId("item") } as T;
            const index = items.findIndex((entry) => entry.id === item.id);
            const next = [...items];
            next.splice(index + 1, 0, copy);
            onChange(next);
          }}
        >
          {render(item, (partial) => patchAt(item.id, partial))}
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        onClick={() => {
          const created = factory();
          onChange([...items, created]);
          opener.open(created.id);
        }}
      >
        {addLabel}
      </Button>
    </div>
  );
}

function ExperienceEditor({
  section,
  onAi,
}: {
  section: Extract<ResumeSection, { kind: "experience" | "volunteer" }>;
  onAi?: AiRequest;
}) {
  const updateSection = useResumeStore((state) => state.updateSection);
  const items = section.data.items;

  const setItems = (next: ExperienceItem[], historyKey?: string) =>
    updateSection(
      section.id,
      (draft) => {
        if (draft.kind === "experience" || draft.kind === "volunteer") draft.data.items = next;
      },
      historyKey ? { historyKey } : undefined,
    );

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <ExperienceItemEditor
          key={item.id}
          item={item}
          onPatch={(partial) =>
            setItems(
              items.map((entry) => (entry.id === item.id ? { ...entry, ...partial } : entry)),
              `exp:${item.id}:${Object.keys(partial).join(",")}`,
            )
          }
          onRemove={() => setItems(items.filter((entry) => entry.id !== item.id))}
          onDuplicate={() => {
            const copy: ExperienceItem = { ...item, id: createId("exp"), bullets: [...item.bullets] };
            const next = [...items];
            next.splice(index + 1, 0, copy);
            setItems(next);
          }}
          onAi={onAi ? () => onAi({ sectionId: section.id, target: "experience", text: [item.role, item.company, item.description, ...item.bullets].filter(Boolean).join("\n"), label: `${item.role || "Role"} at ${item.company || "company"}` }) : undefined}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        onClick={() =>
          setItems([
            ...items,
            {
              id: createId("exp"),
              role: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
              bullets: [""],
              tech: [],
            },
          ])
        }
      >
        Add role
      </Button>
    </div>
  );
}

function ExperienceItemEditor({
  item,
  onPatch,
  onRemove,
  onDuplicate,
  onAi,
}: {
  item: ExperienceItem;
  onPatch: (partial: Partial<ExperienceItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAi?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <ItemCard
      title={item.role || "New role"}
      subtitle={[item.company, item.startDate && `${item.startDate} – ${item.current ? "Present" : item.endDate || ""}`].filter(Boolean).join(" · ")}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      onRemove={onRemove}
      onDuplicate={onDuplicate}
    >
      <TextField label="Job title" value={item.role} onChange={(value) => onPatch({ role: value })} placeholder="Senior Product Engineer" />
      <TwoCol>
        <TextField label="Company" value={item.company} onChange={(value) => onPatch({ company: value })} />
        <TextField label="Location" value={item.location} onChange={(value) => onPatch({ location: value })} placeholder="Remote" />
      </TwoCol>
      <TwoCol>
        <TextField label="Start" value={item.startDate} onChange={(value) => onPatch({ startDate: value })} placeholder="Mar 2022" />
        <TextField
          label="End"
          value={item.current ? "" : item.endDate}
          onChange={(value) => onPatch({ endDate: value })}
          placeholder={item.current ? "Present" : "Feb 2024"}
        />
      </TwoCol>
      <div className="flex items-center gap-2">
        <Switch checked={item.current} onCheckedChange={(value) => onPatch({ current: value })} label="Current role" />
        <span className="text-[12px] text-ink-2">I currently work here</span>
      </div>
      <AreaField label="One-line context (optional)" value={item.description} onChange={(value) => onPatch({ description: value })} rows={2} />
      <BulletEditor bullets={item.bullets} onChange={(bullets) => onPatch({ bullets })} placeholder="Cut invoice disputes by 38% by rebuilding the metering pipeline…" />
      <ListField label="Stack / tools" value={item.tech} onChange={(tech) => onPatch({ tech })} placeholder="TypeScript, PostgreSQL" />
      {onAi ? (
        <Button type="button" variant="subtle" size="sm" onClick={onAi}>
          <Sparkles className="size-3.5" /> Improve these bullets with AI
        </Button>
      ) : null}
    </ItemCard>
  );
}

function EducationEditor({ section }: { section: Extract<ResumeSection, { kind: "education" }> }) {
  const updateSection = useResumeStore((state) => state.updateSection);
  return (
    <ItemListEditor<EducationItem>
      items={section.data.items}
      onChange={(items) =>
        updateSection(
          section.id,
          (draft) => {
            if (draft.kind === "education") draft.data.items = items;
          },
          { historyKey: `edu:${section.id}` },
        )
      }
      factory={() => ({ id: createId("edu"), degree: "", institution: "", location: "", startDate: "", endDate: "", score: "", details: [] })}
      labelOf={(item) => item.degree || item.institution}
      addLabel="Add education"
      render={(item, patch) => (
        <>
          <TextField label="Degree" value={item.degree} onChange={(value) => patch({ degree: value })} placeholder="B.Tech, Computer Science" />
          <TextField label="Institution" value={item.institution} onChange={(value) => patch({ institution: value })} />
          <TwoCol>
            <TextField label="Start" value={item.startDate} onChange={(value) => patch({ startDate: value })} placeholder="2019" />
            <TextField label="End" value={item.endDate} onChange={(value) => patch({ endDate: value })} placeholder="2023" />
          </TwoCol>
          <TwoCol>
            <TextField label="Location" value={item.location} onChange={(value) => patch({ location: value })} />
            <TextField label="Score" value={item.score} onChange={(value) => patch({ score: value })} placeholder="CGPA 8.7/10" />
          </TwoCol>
          <BulletEditor label="Highlights" bullets={item.details} onChange={(details) => patch({ details })} placeholder="Relevant coursework or honours" />
        </>
      )}
    />
  );
}

function ProjectsEditor({ section, onAi }: { section: Extract<ResumeSection, { kind: "projects" }>; onAi?: AiRequest }) {
  const updateSection = useResumeStore((state) => state.updateSection);
  return (
    <ItemListEditor<ProjectItem>
      items={section.data.items}
      onChange={(items) =>
        updateSection(
          section.id,
          (draft) => {
            if (draft.kind === "projects") draft.data.items = items;
          },
          { historyKey: `prj:${section.id}` },
        )
      }
      factory={() => ({ id: createId("prj"), name: "", role: "", url: "", startDate: "", endDate: "", description: "", bullets: [""], tech: [] })}
      labelOf={(item) => item.name}
      addLabel="Add project"
      render={(item, patch) => (
        <>
          <TextField label="Project name" value={item.name} onChange={(value) => patch({ name: value })} />
          <TwoCol>
            <TextField label="Your role" value={item.role} onChange={(value) => patch({ role: value })} placeholder="Creator" />
            <TextField label="Link" value={item.url} onChange={(value) => patch({ url: value })} placeholder="github.com/you/project" />
          </TwoCol>
          <AreaField label="One-line description" value={item.description} onChange={(value) => patch({ description: value })} rows={2} />
          <BulletEditor bullets={item.bullets} onChange={(bullets) => patch({ bullets })} />
          <ListField label="Tech" value={item.tech} onChange={(tech) => patch({ tech })} />
          {onAi ? (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => onAi({ sectionId: section.id, target: "project", text: [item.name, item.description, ...item.bullets].filter(Boolean).join("\n"), label: item.name || "Project" })}
            >
              <Sparkles className="size-3.5" /> Improve with AI
            </Button>
          ) : null}
        </>
      )}
    />
  );
}

export { mutators };
