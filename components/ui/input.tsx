"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

const base =
  "w-full rounded-[5px] border border-line bg-surface px-2.5 text-[13px] text-ink placeholder:text-subtle/70 transition-[border-color,box-shadow] focus-visible:border-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/12 disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(base, "h-9", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, "min-h-[72px] resize-y py-2 leading-relaxed", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[11px] font-medium uppercase tracking-[0.08em] text-subtle", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hint ? <p className="text-[11.5px] leading-snug text-subtle">{hint}</p> : null}
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors",
        checked ? "border-accent bg-accent" : "border-line-strong bg-surface-2",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "block h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[15px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: React.ReactNode;
  id: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="size-3.5 rounded-[3px] border-line-strong accent-[var(--color-accent)]"
      />
      <label htmlFor={id} className="text-[12.5px] text-ink-2">
        {label}
      </label>
    </div>
  );
}
