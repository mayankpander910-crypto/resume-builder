"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[0_1px_2px_rgba(7,66,58,0.24)] hover:bg-accent-hover active:translate-y-[0.5px]",
        secondary:
          "bg-surface text-ink border border-line-strong shadow-[0_1px_1px_rgba(21,23,27,0.04)] hover:bg-surface-2 hover:border-line-strong",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
        subtle: "bg-accent-soft text-accent-ink hover:bg-[#dcebe7]",
        danger: "bg-danger-soft text-danger border border-[#f2d7d4] hover:bg-[#fbe7e5]",
        link: "text-accent underline underline-offset-2 hover:text-accent-hover p-0 h-auto",
        outline: "border border-line text-ink-2 hover:border-accent hover:text-accent bg-transparent",
      },
      size: {
        sm: "h-8 rounded-[5px] px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-9.5 rounded-[6px] px-4 text-sm [&_svg]:size-4",
        lg: "h-11 rounded-[7px] px-5 text-[15px] [&_svg]:size-4.5",
        icon: "h-8 w-8 rounded-[5px] [&_svg]:size-4",
        "icon-sm": "h-7 w-7 rounded-[4px] [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
