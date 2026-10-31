"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, GripVertical, Plus, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-2", className)}>{children}</div>;
}

export function TwoCol({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {hint ? <p className="text-[10.5px] leading-snug text-subtle">{hint}</p> : null}
    </div>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ minHeight: rows * 22 }}
      />
      {hint ? <p className="text-[10.5px] leading-snug text-subtle">{hint}</p> : null}
    </div>
  );
}

/** Comma separated list editor — the fastest way to edit skills, tech and tags. */
export function ListField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value.join(", ");
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={shown}
        placeholder={placeholder}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(
            event.target.value
              .split(",")
              .map((token) => token.trimStart())
              .filter((token) => token.length > 0 || event.target.value.endsWith(",")),
          );
        }}
        onBlur={() => setDraft(null)}
      />
      {hint ? <p className="text-[10.5px] leading-snug text-subtle">{hint}</p> : null}
    </div>
  );
}

export function BulletEditor({
  bullets,
  onChange,
  label = "Bullet points",
  placeholder = "Led the migration of…",
}: {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const update = (index: number, value: string) => {
    const next = [...bullets];
    next[index] = value;
    onChange(next);
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= bullets.length) return;
    const next = [...bullets];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover"
          onClick={() => onChange([...bullets, ""])}
        >
          <Plus className="size-3" /> Add point
        </button>
      </div>
      <div className="space-y-1.5">
        {bullets.map((bullet, index) => (
          <div key={index} className="group/bullet flex items-start gap-1">
            <span className="mt-2 text-[11px] tabular-nums text-subtle/70">{index + 1}</span>
            <Textarea
              value={bullet}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              style={{ minHeight: 40 }}
              className="text-[12.5px]"
            />
            <div className="flex flex-col gap-0.5 pt-0.5 opacity-0 transition-opacity group-hover/bullet:opacity-100">
              <button type="button" onClick={() => move(index, -1)} className="rounded p-0.5 text-subtle hover:bg-surface-2 hover:text-ink" aria-label="Move up">
                <ArrowUp className="size-3" />
              </button>
              <button type="button" onClick={() => move(index, 1)} className="rounded p-0.5 text-subtle hover:bg-surface-2 hover:text-ink" aria-label="Move down">
                <ArrowDown className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onChange(bullets.filter((_, i) => i !== index))}
                className="rounded p-0.5 text-subtle hover:bg-danger-soft hover:text-danger"
                aria-label="Remove bullet"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        ))}
        {bullets.length === 0 ? (
          <button
            type="button"
            onClick={() => onChange([""])}
            className="w-full rounded-[5px] border border-dashed border-line-strong py-2 text-[11.5px] text-subtle hover:border-accent hover:text-accent"
          >
            Add your first bullet point
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ItemCard({
  title,
  subtitle,
  children,
  onRemove,
  onDuplicate,
  open,
  onToggle,
  dragHandle,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRemove: () => void;
  onDuplicate?: () => void;
  open: boolean;
  onToggle: () => void;
  dragHandle?: ReactNode;
}) {
  return (
    <div className={cn("rounded-[6px] border bg-surface transition-colors", open ? "border-line-strong" : "border-line")}>
      <div className="flex items-center gap-1 px-1.5 py-1.5">
        {dragHandle}
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronDown className={cn("size-3.5 shrink-0 text-subtle transition-transform", !open && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-medium text-ink">{title || "Untitled"}</span>
            {subtitle ? <span className="block truncate text-[11px] text-subtle">{subtitle}</span> : null}
          </span>
        </button>
        {onDuplicate ? (
          <button type="button" onClick={onDuplicate} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-ink" aria-label="Duplicate">
            <Copy className="size-3" />
          </button>
        ) : null}
        <button type="button" onClick={onRemove} className="rounded p-1 text-subtle hover:bg-danger-soft hover:text-danger" aria-label="Delete">
          <Trash2 className="size-3" />
        </button>
      </div>
      {open ? <div className="space-y-2.5 border-t border-line px-2.5 py-2.5">{children}</div> : null}
    </div>
  );
}

export function AddButton({ onClick, children, className }: { onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className={cn("w-full justify-center border-dashed", className)}>
      <Plus className="size-3.5" />
      {children}
    </Button>
  );
}

export function Handle({ attributes, listeners }: { attributes: Record<string, unknown>; listeners: Record<string, unknown> }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab rounded p-1 text-subtle/60 hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <GripVertical className="size-3.5" />
    </button>
  );
}
