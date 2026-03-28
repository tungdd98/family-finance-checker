// src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatVND } from "@/lib/gold-utils";
import type { Goal, GoalProjection } from "@/lib/services/goals";

interface Props {
  goal: Goal | null;
  projection: GoalProjection | null;
}

function formatEstimatedDate(date: Date): string {
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function GoalsDashboardCard({ goal, projection }: Props) {
  return (
    <div className="bg-surface border-border border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent h-3.5 w-0.75 shrink-0" />
          <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px] uppercase">
            Mục tiêu
          </span>
        </div>
        <Link
          href="/goals"
          className="text-foreground-muted flex items-center gap-1"
        >
          <span className="text-[12px]">Chi tiết</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {goal && projection ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">{goal.emoji}</span>
              <span className="text-foreground text-[14px] font-bold">
                {goal.name}
              </span>
            </div>
            <span className="text-[20px] font-black tracking-[-0.5px] text-[#D4AF37]">
              {projection.progressPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden bg-[#2a2a2a]">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060]"
              style={{ width: `${projection.progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted text-[12px]">
              {formatVND(projection.currentAssets)} /{" "}
              {formatVND(goal.target_amount)}
            </span>
            {projection.estimatedDate && projection.monthsToGoal! > 0 && (
              <span className="text-foreground-muted text-[12px]">
                Dự kiến{" "}
                <span className="font-semibold text-[#D4AF37]">
                  {formatEstimatedDate(projection.estimatedDate)}
                </span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <Link
          href="/goals"
          className="text-foreground-muted flex items-center justify-between text-[13px]"
        >
          <span>Chưa có mục tiêu nào</span>
          <span className="font-semibold text-[#D4AF37]">Đặt ngay →</span>
        </Link>
      )}
    </div>
  );
}
