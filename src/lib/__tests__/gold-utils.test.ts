import { describe, it, expect } from "vitest";
import {
  chiToLuong,
  luongToChi,
  formatVND,
  calcPnl,
  daysHeld,
  convertInputToChiAndPrice,
} from "@/lib/gold-utils";

describe("chiToLuong", () => {
  it("converts 10 chỉ to 1 lượng", () => {
    expect(chiToLuong(10)).toBe(1);
  });
  it("converts 5 chỉ to 0.5 lượng", () => {
    expect(chiToLuong(5)).toBe(0.5);
  });
});

describe("luongToChi", () => {
  it("converts 1 lượng to 10 chỉ", () => {
    expect(luongToChi(1)).toBe(10);
  });
  it("converts 0.5 lượng to 5 chỉ", () => {
    expect(luongToChi(0.5)).toBe(5);
  });
});

describe("formatVND", () => {
  it("formats 84300000 as VND string", () => {
    expect(formatVND(84300000)).toBe("84.300.000 ₫");
  });
  it("formats 0", () => {
    expect(formatVND(0)).toBe("0 ₫");
  });
});

describe("calcPnl", () => {
  it("calculates profit correctly", () => {
    const result = calcPnl(5, 17_000_000, 18_000_000);
    expect(result.currentValue).toBe(90_000_000);
    expect(result.pnlVnd).toBe(5_000_000);
    expect(result.pnlPercent).toBeCloseTo(5.88, 1);
  });
  it("calculates loss correctly", () => {
    const result = calcPnl(5, 17_100_000, 16_860_000);
    expect(result.pnlVnd).toBe(-1_200_000);
    expect(result.pnlPercent).toBeCloseTo(-1.4, 1);
  });
  it("returns 0 percent when cost is 0", () => {
    const result = calcPnl(0, 0, 17_000_000);
    expect(result.pnlPercent).toBe(0);
  });
});

describe("daysHeld", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysHeld(today)).toBe(0);
  });
  it("returns 1 for yesterday", () => {
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(daysHeld(yesterday)).toBe(1);
  });
});

describe("convertInputToChiAndPrice", () => {
  it("returns chi and price unchanged when unit is chi", () => {
    const result = convertInputToChiAndPrice(5, 17_000_000, "chi");
    expect(result.quantityChi).toBe(5);
    expect(result.pricePerChi).toBe(17_000_000);
  });
  it("converts luong to chi and price per luong to price per chi", () => {
    const result = convertInputToChiAndPrice(1, 170_000_000, "luong");
    expect(result.quantityChi).toBe(10);
    expect(result.pricePerChi).toBe(17_000_000);
  });
});
