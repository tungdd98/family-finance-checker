// src/app/(protected)/gold/components/PositionCard.tsx
"use client";

import {
  formatVND,
  formatPct,
  calcPnl,
  daysHeld,
  CHI_PER_LUONG,
} from "@/lib/gold-utils";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

interface Props {
  position: GoldAsset;
  livePrice: GoldPrice | undefined;
  onTap: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function PositionCard({ position, livePrice, onTap }: Readonly<Props>) {
  const remaining = position.quantity - position.sold_quantity;
  const hasPnl = livePrice !== undefined;
  const pnl = hasPnl
    ? calcPnl(
        remaining,
        position.buy_price_per_chi,
        livePrice.sell / CHI_PER_LUONG
      )
    : null;
  const days = daysHeld(position.buy_date);
  const totalCapital = remaining * position.buy_price_per_chi;

  const pnlColor =
    pnl === null
      ? "text-foreground-muted"
      : pnl.pnlVnd >= 0
        ? "text-status-positive"
        : "text-status-negative";

  const pnlValue = pnl
    ? `${pnl.pnlVnd >= 0 ? "+" : ""}${formatVND(pnl.pnlVnd)} (${formatPct(pnl.pnlPercent)})`
    : "—";

  return (
    <button
      onClick={onTap}
      className="bg-surface active:bg-surface-elevated flex w-full flex-col gap-3 p-4 text-left transition-colors"
    >
      {/* Header row */}
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-semibold">
            {position.brand_name}
          </span>
          <span className="text-foreground-muted text-xs">
            {formatDate(position.buy_date)} · {days} ngày
          </span>
        </div>
        <div className="text-right">
          <span className="text-accent text-base font-bold">
            {remaining} chỉ
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-border border-t" />

      {/* Detail rows */}
      <div className="flex w-full flex-col gap-2">
        <DetailRow
          label="Giá mua"
          value={formatVND(position.buy_price_per_chi) + "/chỉ"}
        />
        <DetailRow label="Tổng tiền vốn" value={formatVND(totalCapital)} />
        <DetailRow
          label="Giá trị hiện tại"
          value={pnl ? formatVND(pnl.currentValue) : "—"}
        />
        <DetailRow
          label="Lãi dự tính"
          value={pnlValue}
          valueClass={`font-semibold ${pnlColor}`}
        />
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
  valueClass = "text-foreground font-medium",
}: Readonly<{
  label: string;
  value: string;
  valueClass?: string;
}>) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-muted text-xs">{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}
