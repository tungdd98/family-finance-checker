import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "border-border-strong bg-surface-elevated text-foreground placeholder:text-foreground-muted focus-visible:border-accent focus-visible:ring-accent h-12 w-full min-w-0 rounded-none border px-3 text-[13px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
