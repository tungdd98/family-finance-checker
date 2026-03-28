export { formatVND } from "@/lib/utils";

export const CHI_PER_LUONG = 10;

export function chiToLuong(chi: number): number {
  return chi / CHI_PER_LUONG;
}

export function luongToChi(luong: number): number {
  return luong * CHI_PER_LUONG;
}

export function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export interface PnlResult {
  currentValue: number;
  pnlVnd: number;
  pnlPercent: number;
}

export function calcPnl(
  remainingQty: number,
  buyPricePerChi: number,
  liveSellPrice: number
): PnlResult {
  const currentValue = remainingQty * liveSellPrice;
  const totalCost = remainingQty * buyPricePerChi;
  const pnlVnd = currentValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnlVnd / totalCost) * 100 : 0;
  return { currentValue, pnlVnd, pnlPercent };
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysHeld(buyDate: string, now: Date = new Date()): number {
  const buy = new Date(buyDate);
  return Math.floor((now.getTime() - buy.getTime()) / MS_PER_DAY);
}

export function convertInputToChiAndPrice(
  quantity: number,
  pricePerUnit: number,
  unit: "chi" | "luong"
): { quantityChi: number; pricePerChi: number } {
  if (unit === "chi") {
    return { quantityChi: quantity, pricePerChi: pricePerUnit };
  }
  return {
    quantityChi: luongToChi(quantity),
    pricePerChi: Math.round(pricePerUnit / CHI_PER_LUONG),
  };
}
