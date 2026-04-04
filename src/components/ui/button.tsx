"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-none font-bold uppercase text-xs whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "h-12 bg-accent text-background px-6 hover:bg-[#c9a430] hover:shadow-[0_0_16px_#d4af3740]",
        secondary:
          "h-12 bg-surface border border-border-strong text-foreground px-6 hover:bg-surface-elevated hover:border-foreground-muted",
        outline:
          "h-12 bg-transparent border border-accent text-accent px-6 hover:bg-accent hover:text-background",
        ghost:
          "h-12 bg-transparent text-foreground-muted px-6 hover:text-foreground hover:bg-surface",
        destructive: "h-12 bg-status-negative text-white px-6 hover:opacity-85",
        sm: "h-9 bg-surface border border-border-strong text-foreground text-xs px-4 hover:bg-surface-elevated hover:border-foreground-muted",
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
