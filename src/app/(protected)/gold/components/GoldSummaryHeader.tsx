// src/app/(protected)/gold/components/GoldSummaryHeader.tsx
"use client";

import { Plus, ChevronLeft } from "lucide-react";
import Link from "next/link";
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
  onAdd: () => void;
}

export function GoldSummaryHeader({
  totalValue,
  positionCount,
  brands,
  filterBrand,
  onFilterChange,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Page title row */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Link
            href="/assets"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-foreground text-[28px] font-bold">
            TÀI SẢN VÀNG
          </h1>
        </div>
        <button
          onClick={onAdd}
          className="bg-accent text-background flex h-11 w-11 shrink-0 items-center justify-center"
          aria-label="Thêm tài sản"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-surface flex flex-col gap-1 p-4">
        <p className="type-section-label">TỔNG GIÁ TRỊ ƯỚC TÍNH</p>
        <p className="text-foreground text-[28px] font-bold">
          {totalValue > 0 ? formatVND(totalValue) : "—"}
        </p>
        <p className="text-foreground-secondary text-xs">
          {positionCount} tài sản đang nắm giữ
        </p>
      </div>

      {/* Filter chips */}
      {brands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange(null)}
            className={`border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
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
              className={`border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
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
