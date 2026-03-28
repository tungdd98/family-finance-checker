// src/app/(protected)/gold/GoldClient.tsx
"use client";

import { useState, useEffect } from "react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

interface Props {
  initialPositions: GoldAsset[];
}

export function GoldClient({ initialPositions }: Props) {
  const [positions] = useState<GoldAsset[]>(initialPositions);
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "sell" | "delete" | null
  >(null);
  const [selectedPosition, setSelectedPosition] = useState<GoldAsset | null>(
    null
  );
  const [filterBrand, setFilterBrand] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gold/prices")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPrices(json.data);
        }
      })
      .catch(() => {
        // prices stay empty — UI shows "—"
      });
  }, []);

  const priceMap = new Map<string, GoldPrice>(
    prices.map((p) => [p.type_code, p])
  );

  const filteredPositions = filterBrand
    ? positions.filter((p) => p.brand_code === filterBrand)
    : positions;

  const uniqueBrands = [...new Set(positions.map((p) => p.brand_code))].map(
    (code) => ({
      code,
      name: positions.find((p) => p.brand_code === code)!.brand_name,
    })
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-foreground-muted text-sm">
        {positions.length} tài sản — skeleton (wired in Task 13)
      </p>
    </div>
  );
}
