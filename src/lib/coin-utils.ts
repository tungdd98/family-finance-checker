import type { CoinPrice } from "@/lib/services/coin";

export function formatCoinPrice(price: number): string {
  if (price >= 1) {
    return (
      "$" +
      price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  if (price >= 0.01) {
    return "$" + price.toFixed(4);
  }
  return "$" + price.toFixed(6);
}

export function filterCoins(coins: CoinPrice[], query: string): CoinPrice[] {
  const q = query.trim().toLowerCase();
  if (!q) return coins;
  return coins.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
  );
}
