"use client";

import { useRouter } from "next/navigation";
import { formatVND } from "@/lib/gold-utils";

interface Props {
  savingsTotal: number;
  goldTotal: number;
}

export function AssetsClient({ savingsTotal, goldTotal }: Props) {
  const router = useRouter();
  const netWorth = savingsTotal + goldTotal;

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="pt-2">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          Tài Sản
        </h1>
      </div>

      {/* Net worth banner */}
      <div className="bg-surface border-border flex flex-col gap-1 border p-5">
        <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
          Tổng tài sản
        </span>
        <span className="text-[32px] font-black tracking-[-1px] text-[#D4AF37]">
          {formatVND(netWorth)}
        </span>
      </div>

      {/* 2×2 asset grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/gold")}
          className="bg-surface border-border flex flex-col gap-2 border p-4 text-left"
        >
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Vàng
          </span>
          <span className="text-foreground text-[20px] font-bold tracking-[-0.5px]">
            {formatVND(goldTotal)}
          </span>
        </button>

        <button
          onClick={() => router.push("/savings")}
          className="bg-surface border-border flex flex-col gap-2 border p-4 text-left"
        >
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Tiết Kiệm
          </span>
          <span className="text-foreground text-[20px] font-bold tracking-[-0.5px]">
            {formatVND(savingsTotal)}
          </span>
        </button>

        <div className="bg-surface border-border flex flex-col gap-2 border border-dashed p-4 opacity-40">
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Coin
          </span>
          <span className="text-foreground-muted text-[13px]">Sắp ra mắt</span>
        </div>

        <div className="bg-surface border-border flex flex-col gap-2 border border-dashed p-4 opacity-40">
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Chứng Khoán
          </span>
          <span className="text-foreground-muted text-[13px]">Sắp ra mắt</span>
        </div>
      </div>
    </div>
  );
}
