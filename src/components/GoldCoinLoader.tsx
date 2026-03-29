"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
}

/**
 * A premium animated gold coin loader component.
 * Features 3D spinning, floating, and a sweeping shine effect.
 */
export function GoldCoinLoader({ className, size = 64 }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative animate-[coin-float_3s_ease-in-out_infinite]"
        style={{ width: size, height: size }}
      >
        {/* The Coin Container - handled by rotating Y axis */}
        <div
          className="relative h-full w-full animate-[coin-spin_2.5s_linear_infinite]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Main Coin Body */}
          <div
            className="absolute inset-0 rounded-full border-[4px] border-[#b8860b] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            style={{
              background:
                "radial-gradient(circle, #ffd700 0%, #d4af37 70%, #b8860b 100%)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Inner Ring Detail */}
            <div className="absolute inset-2 rounded-full border border-[#b8860b]/30" />

            {/* Center Symbol ($) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[24px] font-bold text-[#8b6508] drop-shadow-sm select-none">
                $
              </span>
            </div>

            {/* Premium Shine Effect */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div
                className="absolute top-0 h-full w-full skew-x-[-25deg] animate-[coin-shine_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ width: "200%" }}
              />
            </div>
          </div>

          {/* Back side of the coin (optional but adds to 3D effect) */}
          <div
            className="absolute inset-0 rounded-full border-[4px] border-[#b8860b]"
            style={{
              background:
                "radial-gradient(circle, #ffd700 0%, #d4af37 70%, #b8860b 100%)",
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <span className="text-[20px] font-bold text-[#8b6508]">$</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
