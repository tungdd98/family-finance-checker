// src/app/(protected)/gold/GoldClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { calcPnl } from "@/lib/gold-utils";
import { GoldSummaryHeader } from "./components/GoldSummaryHeader";
import { PositionCard } from "./components/PositionCard";
import { PositionActionSheet } from "./components/PositionActionSheet";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { AddEditAssetSheet } from "./components/AddEditAssetSheet";
import { SellAssetSheet } from "./components/SellAssetSheet";

interface Props {
  initialPositions: GoldAsset[];
}

export function GoldClient({ initialPositions }: Props) {
  const [positions] = useState<GoldAsset[]>(initialPositions);
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "sell" | "delete" | "action" | null
  >(null);
  const [selectedPosition, setSelectedPosition] = useState<GoldAsset | null>(
    null
  );
  const [filterBrand, setFilterBrand] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gold/prices")
      .then((r) => r.json())
      .then((json: { success: boolean; data: GoldPrice[] }) => {
        if (json.success && Array.isArray(json.data)) {
          setPrices(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const priceMap = new Map<string, GoldPrice>(
    prices.map((p) => [p.type_code, p])
  );

  const filteredPositions = filterBrand
    ? positions.filter((p) => p.brand_code === filterBrand)
    : positions;

  const uniqueBrands = [
    ...new Map(positions.map((p) => [p.brand_code, p])).values(),
  ].map((p) => ({ code: p.brand_code, name: p.brand_name }));

  const totalValue = positions.reduce((sum, pos) => {
    const livePrice = priceMap.get(pos.brand_code);
    if (!livePrice) return sum;
    const remaining = pos.quantity - pos.sold_quantity;
    const { currentValue } = calcPnl(
      remaining,
      pos.buy_price_per_chi,
      livePrice.sell
    );
    return sum + currentValue;
  }, 0);

  const openAction = (position: GoldAsset) => {
    setSelectedPosition(position);
    setActiveSheet("action");
  };

  return (
    <div className="flex flex-col gap-5 pb-5">
      <GoldSummaryHeader
        totalValue={totalValue}
        positionCount={positions.length}
        brands={uniqueBrands}
        filterBrand={filterBrand}
        onFilterChange={setFilterBrand}
      />

      {/* Position list */}
      {filteredPositions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-foreground-muted text-[14px]">
            Chưa có tài sản vàng nào
          </p>
          <p className="text-foreground-muted text-[12px]">
            Nhấn + để thêm tài sản đầu tiên
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPositions.map((pos) => (
            <PositionCard
              key={pos.id}
              position={pos}
              livePrice={priceMap.get(pos.brand_code)}
              onTap={() => openAction(pos)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setActiveSheet("add")}
        className="bg-accent text-background fixed right-7 bottom-[116px] flex h-14 w-14 items-center justify-center shadow-lg"
        aria-label="Thêm tài sản"
      >
        <Plus size={24} />
      </button>

      {/* Sheets */}
      <PositionActionSheet
        position={selectedPosition}
        open={activeSheet === "action"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
        onEdit={() => setActiveSheet("edit")}
        onSell={() => setActiveSheet("sell")}
        onDelete={() => setActiveSheet("delete")}
      />

      <AddEditAssetSheet
        mode="add"
        prices={prices}
        open={activeSheet === "add"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />

      <AddEditAssetSheet
        mode="edit"
        position={selectedPosition ?? undefined}
        prices={prices}
        open={activeSheet === "edit"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />

      <SellAssetSheet
        position={selectedPosition}
        open={activeSheet === "sell"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />

      <DeleteConfirmDialog
        position={selectedPosition}
        open={activeSheet === "delete"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />
    </div>
  );
}
