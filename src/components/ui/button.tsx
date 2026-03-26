"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-none font-bold uppercase tracking-[2px] text-[11px] whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "h-12 bg-accent text-background px-6",
        secondary:
          "h-12 bg-surface border border-border-strong text-foreground px-6",
        outline: "h-12 bg-transparent border border-accent text-accent px-6",
        ghost: "h-12 bg-transparent text-foreground-muted px-6",
        destructive: "h-12 bg-status-negative text-white px-6",
        sm: "h-9 bg-surface border border-border-strong text-foreground text-[10px] tracking-[1.5px] px-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
