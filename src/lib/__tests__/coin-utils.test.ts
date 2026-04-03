import { describe, it, expect } from "vitest";
import { formatCoinPrice, filterCoins } from "@/lib/coin-utils";
import type { CoinPrice } from "@/lib/services/coin";

describe("formatCoinPrice", () => {
  it("formats large price with 2 decimal places and thousands separator", () => {
    expect(formatCoinPrice(94250)).toBe("$94,250.00");
  });
  it("formats price between 0.01 and 1 with 4 decimal places", () => {
    expect(formatCoinPrice(0.45)).toBe("$0.4500");
  });
  it("formats very small price with 6 decimal places", () => {
    expect(formatCoinPrice(0.000045)).toBe("$0.000045");
  });
  it("formats exactly 1 with 2 decimal places", () => {
    expect(formatCoinPrice(1)).toBe("$1.00");
  });
});

const mockCoins: CoinPrice[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "",
    current_price: 94250,
    price_change_percentage_24h: 2.3,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "",
    current_price: 3200,
    price_change_percentage_24h: -1.2,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "",
    current_price: 150,
    price_change_percentage_24h: 5.1,
  },
];

describe("filterCoins", () => {
  it("returns all coins for empty query", () => {
    expect(filterCoins(mockCoins, "")).toHaveLength(3);
  });
  it("filters by name case-insensitively", () => {
    expect(filterCoins(mockCoins, "bitcoin")).toHaveLength(1);
    expect(filterCoins(mockCoins, "BITCOIN")).toHaveLength(1);
  });
  it("filters by symbol", () => {
    expect(filterCoins(mockCoins, "eth")).toHaveLength(1);
    expect(filterCoins(mockCoins, "ETH")).toHaveLength(1);
  });
  it("returns empty array when no match", () => {
    expect(filterCoins(mockCoins, "xyz")).toHaveLength(0);
  });
  it("trims whitespace from query", () => {
    expect(filterCoins(mockCoins, "  btc  ")).toHaveLength(1);
  });
});
