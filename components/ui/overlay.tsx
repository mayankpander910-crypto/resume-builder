"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title?: string; description?: string; wide?: boolean }
>(({ className, children, title, description, wide, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#15171b]/35 backdrop-blur-[1.5px] data-[state=open]:animate-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[10px] border border-line bg-surface p-5 shadow-[var(--shadow-pop)]",
        wide ? "max-w-3xl" : "max-w-lg",
        className,
      )}
      {...props}
    >
      {title ? (
        <div className="mb-4 pr-8">
          <DialogPrimitive.Title className="text-[15px] font-semibold text-ink">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-[12.5px] leading-relaxed text-subtle">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
      ) : null}
      {children}
      <DialogPrimitive.Close className="absolute right-3.5 top-3.5 rounded-[4px] p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-ink">
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[190px] overflow-hidden rounded-[7px] border border-line bg-surface p-1 shadow-[var(--shadow-pop)]",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] text-ink-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink [&_svg]:size-3.5 [&_svg]:text-subtle",
      destructive && "text-danger data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger [&_svg]:text-danger",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-subtle">{children}</div>
);

export const DropdownMenuSeparator = () => <div className="my-1 h-px bg-line" />;
