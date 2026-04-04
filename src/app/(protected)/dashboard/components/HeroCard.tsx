import Link from "next/link";
import { formatVND } from "@/lib/gold-utils";

interface HeroGoal {
  name: string;
  emoji: string;
  target: number;
  currentAssets: number;
  progressPct: number;
  projectedDate: string | null;
}

interface HeroCardProps {
  netWorth: number;
  goal: HeroGoal | null;
}

export function HeroCard({ netWorth, goal }: HeroCardProps) {
  const compactNetWorth = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(netWorth);

  const clampedPct = goal ? Math.min(100, Math.max(0, goal.progressPct)) : 0;

  return (
    <div className="bg-surface border-border border p-4">
      {/* Top row: net worth (left) + goal % (right) */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground-secondary text-[9px] font-bold tracking-[1.5px] uppercase">
            Tổng tài sản
          </span>
          <span className="text-foreground text-[26px] leading-none font-black tracking-[-1px]">
            {compactNetWorth}
          </span>
        </div>

        {goal ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-foreground-secondary text-[9px] font-bold tracking-[1.5px] uppercase">
              Mục tiêu
            </span>
            <span className="text-accent text-[26px] leading-none font-black tracking-[-1px]">
              {goal.progressPct}%
            </span>
          </div>
        ) : (
          <Link
            href="/goals"
            className="text-accent text-[11px] font-bold tracking-[0.5px]"
          >
            Đặt mục tiêu →
          </Link>
        )}
      </div>

      {goal && (
        <>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden bg-[#2a2a2a]">
            <div
              className="from-accent h-full bg-gradient-to-r to-[#f0d060]"
              style={{ width: `${clampedPct}%` }}
            />
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-foreground-muted text-[11px]">
              {goal.emoji} {goal.name} · {formatVND(goal.currentAssets)} /{" "}
              {formatVND(goal.target)}
            </span>
            {goal.projectedDate && (
              <span className="text-foreground-muted text-[11px]">
                Dự kiến{" "}
                <span className="text-accent font-semibold">
                  {goal.projectedDate}
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
