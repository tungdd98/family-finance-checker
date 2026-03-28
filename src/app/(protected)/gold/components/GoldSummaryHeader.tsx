// src/app/(protected)/gold/components/GoldSummaryHeader.tsx
"use client";

import { formatVND } from "@/lib/gold-utils";

interface Brand {
  code: string;
  name: string;
}

interface Props {
  totalValue: number;
  positionCount: number;
  brands: Brand[];
  filterBrand: string | null;
  onFilterChange: (brandCode: string | null) => void;
}

export function GoldSummaryHeader({
  totalValue,
  positionCount,
  brands,
  filterBrand,
  onFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <h1 className="text-foreground pt-2 text-[28px] font-bold tracking-[-1px]">
        TÀI SẢN VÀNG
      </h1>

      {/* Summary card */}
      <div className="bg-surface flex flex-col gap-1 p-4">
        <p className="text-foreground-muted text-[11px] font-semibold tracking-[1.5px]">
          TỔNG GIÁ TRỊ ƯỚC TÍNH
        </p>
        <p className="text-foreground text-[28px] font-bold tracking-[-1px]">
          {totalValue > 0 ? formatVND(totalValue) : "—"}
        </p>
        <p className="text-foreground-secondary text-[12px]">
          {positionCount} tài sản đang nắm giữ
        </p>
      </div>

      {/* Filter chips */}
      {brands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange(null)}
            className={`border px-3 py-1.5 text-[11px] font-semibold tracking-[1px] transition-colors ${
              filterBrand === null
                ? "bg-accent text-background border-accent"
                : "bg-surface border-border text-foreground-secondary"
            }`}
          >
            Tất cả
          </button>
          {brands.map((b) => (
            <button
              key={b.code}
              onClick={() => onFilterChange(b.code)}
              className={`border px-3 py-1.5 text-[11px] font-semibold tracking-[1px] transition-colors ${
                filterBrand === b.code
                  ? "bg-accent text-background border-accent"
                  : "bg-surface border-border text-foreground-secondary"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
