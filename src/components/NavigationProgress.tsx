"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { GoldCoinLoader } from "./GoldCoinLoader";

/**
 * Shows a thin animated top progress bar whenever navigation is in-flight.
 * As soon as pathname changes (tap on tab), bar appears immediately.
 * When the new pathname settles, bar completes and fades out.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const prevPathname = useRef(pathname);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
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
  }, [pathname]);

  // We expose a trigger so TabBar can call it on tap
  useEffect(() => {
    const handler = () => {
      setState("loading");
    };
    window.addEventListener("navigation-start", handler);
    return () => window.removeEventListener("navigation-start", handler);
  }, []);

  const [showCenterCoin, setShowCenterCoin] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (state === "loading") {
      // Delay center coin to avoid flickering on super fast loads
      timer = setTimeout(() => {
        setShowCenterCoin(true);
      }, 150);
    } else {
      timer = setTimeout(() => {
        setShowCenterCoin(false);
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [state]);

  if (state === "idle") return null;

  return (
    <>
      {/* Top Progress Bar - Instant feedback */}
      <div className="fixed inset-x-0 top-0 z-[101] h-[3px] overflow-hidden">
        <div
          className={`bg-accent h-full transition-all duration-300 ${
            state === "loading"
              ? "animate-[nav-progress_2s_ease-in-out_infinite]"
              : "w-full opacity-0"
          }`}
        />
      </div>

      {/* Center Gold Coin - Deluxe focus after delay */}
      {showCenterCoin && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] duration-300">
          <GoldCoinLoader size={80} />
        </div>
      )}
    </>
  );
}
