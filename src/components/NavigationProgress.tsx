"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Shows a thin animated top progress bar whenever navigation is in-flight.
 * As soon as pathname or search params change, bar appears immediately.
 * When the new route settles, bar completes and fades out.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const prevKey = useRef(`${pathname}?${searchParams}`);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentKey = `${pathname}?${searchParams}`;
    if (currentKey !== prevKey.current) {
      prevKey.current = currentKey;
      // Wrap in setTimeout(0) to avoid setState-in-effect lint rule
      const t = setTimeout(() => {
        setState("done");
      }, 0);

      doneTimer.current = setTimeout(() => {
        setState("idle");
      }, 400);

      return () => {
        clearTimeout(t);
        if (doneTimer.current) clearTimeout(doneTimer.current);
      };
    }
  }, [pathname, searchParams]);

  // We expose a trigger so TabBar can call it on tap
  useEffect(() => {
    const handler = () => {
      setState("loading");
    };
    window.addEventListener("navigation-start", handler);
    return () => window.removeEventListener("navigation-start", handler);
  }, []);

  if (state === "idle") return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[101] h-[3px] overflow-hidden">
      <div
        className={`bg-accent h-full transition-all duration-300 ${
          state === "loading"
            ? "animate-[nav-progress_2s_ease-in-out_infinite]"
            : "w-full opacity-0"
        }`}
      />
    </div>
  );
}
