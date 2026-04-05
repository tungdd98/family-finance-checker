// src/app/(protected)/gold/GoldClient.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { deleteAssetAction } from "@/app/actions/gold";
import { GoldSummaryHeader } from "./components/GoldSummaryHeader";
import { PositionCard } from "./components/PositionCard";
import { PositionActionSheet } from "./components/PositionActionSheet";
import { DeleteConfirmDialog } from "@/components/common";
import { AddEditAssetSheet } from "./components/AddEditAssetSheet";
import { SellAssetSheet } from "./components/SellAssetSheet";

interface Props {
  initialPositions: GoldAsset[];
  initialPrices: GoldPrice[];
}

export function GoldClient({
  initialPositions,
  initialPrices = [],
}: Readonly<Props>) {
  const positions = initialPositions;
  const [prices, setPrices] = useState<GoldPrice[]>(initialPrices);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    // Fallback in case server-side fetch failed or returned empty
    if (prices.length === 0) {
      fetch("/api/gold/prices")
        .then((r) => r.json())
        .then((json: { success: boolean; data: GoldPrice[] }) => {
          if (json.success && Array.isArray(json.data)) {
            setPrices(json.data);
          }
        })
        .catch(() => {});
    }
  }, [prices.length]);

  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "sell" | "delete" | "action" | null
  >(null);
  const [selectedPosition, setSelectedPosition] = useState<GoldAsset | null>(
    null
  );
  const [filterBrand, setFilterBrand] = useState<string | null>(null);

  const priceMap = new Map<string, GoldPrice>(
    (prices || []).map((p) => [p.type_code, p])
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
      livePrice.sell / CHI_PER_LUONG
    );
    return sum + currentValue;
  }, 0);

  const openAction = (position: GoldAsset) => {
    setSelectedPosition(position);
    setActiveSheet("action");
  };

  const handleDeleteConfirm = () => {
    if (!selectedPosition) return;
    startDeleteTransition(async () => {
      const result = await deleteAssetAction(selectedPosition.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa tài sản");
        router.refresh();
        setActiveSheet(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="bg-background sticky top-0 z-20 -mx-5 px-5 pt-5 pb-4 lg:-mx-10 lg:px-10">
        <GoldSummaryHeader
          totalValue={totalValue}
          positionCount={positions.length}
          brands={uniqueBrands}
          filterBrand={filterBrand}
          onFilterChange={setFilterBrand}
          onAdd={() => setActiveSheet("add")}
        />
      </div>

      {/* Position list */}
      {filteredPositions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-foreground-muted text-sm">
            Chưa có tài sản vàng nào
          </p>
          <p className="text-foreground-muted text-xs">
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
        key={selectedPosition?.id ?? "edit"}
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
        open={activeSheet === "delete"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
        title="Xóa tài sản"
        description={
          selectedPosition
            ? `Bạn có chắc muốn xóa tài sản mua ${selectedPosition.quantity - selectedPosition.sold_quantity} chỉ ${selectedPosition.brand_name}?`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </div>
  );
}
