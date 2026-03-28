// src/app/(protected)/gold/components/PositionCard.tsx
"use client";

import { formatVND, formatPct, calcPnl, daysHeld } from "@/lib/gold-utils";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

interface Props {
  position: GoldAsset;
  livePrice: GoldPrice | undefined;
  onTap: () => void;
}

export function PositionCard({ position, livePrice, onTap }: Props) {
  const remaining = position.quantity - position.sold_quantity;
  const hasPnl = livePrice !== undefined;
  const pnl = hasPnl
    ? calcPnl(remaining, position.buy_price_per_chi, livePrice.sell)
    : null;
  const days = daysHeld(position.buy_date);
  const totalCapital = remaining * position.buy_price_per_chi;

  const pnlColor =
    pnl === null
      ? ""
      : pnl.pnlVnd >= 0
        ? "text-status-positive"
        : "text-status-negative";

  return (
    <button
      onClick={onTap}
      className="bg-surface flex w-full flex-col gap-3 p-4 text-left"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-[14px] font-semibold">
            {position.brand_name}
          </span>
          <span className="text-foreground-muted text-[11px]">
            {position.buy_date} · {days} ngày
          </span>
        </div>
        <div className="text-right">
          <span className="text-accent text-[16px] font-bold">
            {remaining} chỉ
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-border border-t" />

      {/* Detail rows */}
      <div className="flex flex-col gap-2">
        <DetailRow
          label="Giá mua"
          value={formatVND(position.buy_price_per_chi) + "/chỉ"}
        />
        <DetailRow label="Tổng tiền vốn" value={formatVND(totalCapital)} />
        <DetailRow
          label="Giá trị hiện tại"
          value={pnl ? formatVND(pnl.currentValue) : "—"}
        />
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted text-[12px]">Lãi dự tính</span>
          <span className={`text-[13px] font-semibold ${pnlColor}`}>
            {pnl
              ? `${pnl.pnlVnd >= 0 ? "+" : ""}${formatVND(pnl.pnlVnd)} (${formatPct(pnl.pnlPercent)})`
              : "—"}
          </span>
        </div>
      </div>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-muted text-[12px]">{label}</span>
      <span className="text-foreground text-[13px] font-medium">{value}</span>
    </div>
  );
}
