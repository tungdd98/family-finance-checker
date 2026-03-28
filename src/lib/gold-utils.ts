export const CHI_PER_LUONG = 10;

export function chiToLuong(chi: number): number {
  return chi / CHI_PER_LUONG;
}

export function luongToChi(luong: number): number {
  return luong * CHI_PER_LUONG;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
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

export function daysHeld(buyDate: string): number {
  const now = new Date();
  const buy = new Date(buyDate);
  return Math.floor((now.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24));
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
