// src/app/(protected)/dashboard/components/RecentTransactions.tsx
"use client";

import type { RecentTx, TxKind } from "@/types/transactions";

interface Props {
  transactions: RecentTx[];
}

const iconConfig: Record<
  TxKind,
  {
    icon: string;
    bgClass: string;
    amountClass: string;
    prefix: string;
  }
> = {
  income: {
    icon: "↑",
    bgClass: "bg-status-positive/20",
    amountClass: "text-status-positive",
    prefix: "+",
  },
  expense: {
    icon: "↓",
    bgClass: "bg-status-negative/20",
    amountClass: "text-status-negative",
    prefix: "−",
  },
  gold_buy: {
    icon: "✦",
    bgClass: "bg-accent/20",
    amountClass: "text-accent",
    prefix: "−",
  },
  gold_sell: {
    icon: "✦",
    bgClass: "bg-accent/20",
    amountClass: "text-status-positive",
    prefix: "+",
  },
  savings: {
    icon: "⬡",
    bgClass: "bg-[#6B7FD7]/20",
    amountClass: "text-[#6B7FD7]",
    prefix: "+",
  },
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function RecentTransactions({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mt-2">
        <h2 className="text-foreground mb-2 text-[13px] font-bold tracking-[0.5px] uppercase">
          GIAO DỊCH GẦN ĐÂY
        </h2>
        <p className="text-foreground-muted text-[13px]">
          Chưa có giao dịch nào
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h2 className="text-foreground mb-2 text-[13px] font-bold tracking-[0.5px] uppercase">
        GIAO DỊCH GẦN ĐÂY
      </h2>
      <div className="divide-border flex flex-col divide-y">
        {transactions.map((tx, idx) => {
          const config = iconConfig[tx.kind];
          return (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-6 w-6 ${config.bgClass} flex flex-shrink-0 items-center justify-center rounded-full`}
                >
                  <span className={`${config.amountClass} text-[10px]`}>
                    {config.icon}
                  </span>
                </div>
                <span className="text-foreground text-[13px] font-medium">
                  {tx.label}
                </span>
              </div>
              <div className="text-right">
                <div
                  className={`${config.amountClass} text-[13px] font-semibold`}
                >
                  {config.prefix}
                  {formatAmount(tx.amount)}
                </div>
                <div className="text-foreground-muted text-[11px] font-medium">
                  {formatDate(tx.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
