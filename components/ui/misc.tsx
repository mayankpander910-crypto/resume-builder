"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils/cn";

export const Slider = ({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  label?: string;
}) => (
  <SliderPrimitive.Root
    className="relative flex h-4 w-full touch-none select-none items-center"
    value={[value]}
    min={min}
    max={max}
    step={step}
    onValueChange={([next]) => onValueChange(next)}
    aria-label={label}
  >
    <SliderPrimitive.Track className="relative h-[3px] w-full grow rounded-full bg-line-strong/70">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-3 rounded-full border border-accent bg-white shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
  </SliderPrimitive.Root>
);

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex h-8 items-center gap-0.5 rounded-[5px] bg-surface-2 p-0.5", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[12.5px] font-medium text-subtle transition-colors hover:text-ink data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-[0_1px_2px_rgba(21,23,27,0.08)]",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = TabsPrimitive.Content;

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ label, children, side = "bottom" }: { label: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-[220px] rounded-[5px] bg-ink px-2 py-1 text-[11.5px] font-medium leading-snug text-white shadow-[var(--shadow-pop)]"
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warn" | "ok" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "border-line bg-surface-2 text-subtle",
    accent: "border-[#cfe3dd] bg-accent-soft text-accent-ink",
    warn: "border-[#f0e2b8] bg-warn-soft text-warn",
    ok: "border-[#cfe8d8] bg-ok-soft text-ok",
    danger: "border-[#f3d6d2] bg-danger-soft text-danger",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[11px] font-medium leading-[1.5]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[10px] border border-line bg-surface shadow-[var(--shadow-card)]", className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-line-strong px-6 py-9 text-center", className)}>
      {icon ? <div className="mb-1 text-subtle [&_svg]:size-5">{icon}</div> : null}
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {description ? <p className="max-w-[36ch] text-[12px] leading-relaxed text-subtle">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent", className)}
      aria-hidden
    />
  );
}

export function ScoreRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? "#15803d" : pct >= 60 ? "#a16207" : "#b42318";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8e5de" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[15px] font-semibold leading-none text-ink">{Math.round(pct)}</div>
        {label ? <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-subtle">{label}</div> : null}
      </div>
    </div>
  );
}
