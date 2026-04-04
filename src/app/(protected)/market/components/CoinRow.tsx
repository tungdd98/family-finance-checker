"use client";

import { useState } from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { CoinPrice } from "@/lib/services/coin";
import { formatCoinPrice } from "@/lib/coin-utils";

interface Props {
  coin: CoinPrice;
}

export function CoinRow({ coin }: Props) {
  const [imgError, setImgError] = useState(false);
  const isUp = coin.price_change_percentage_24h >= 0;
  const changeColor = isUp ? "text-status-positive" : "text-status-negative";
  const ChangeIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="bg-surface border-border relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border">
          {imgError ? (
            <span className="text-foreground-muted text-xs font-bold uppercase">
              {coin.symbol.slice(0, 2)}
            </span>
          ) : (
            <Image
              src={coin.image}
              alt={coin.name}
              fill
              sizes="32px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-bold">{coin.name}</span>
          <span className="text-foreground-muted text-xs font-semibold uppercase">
            {coin.symbol}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-foreground text-base font-bold">
          {formatCoinPrice(coin.current_price)}
        </span>
        <div
          className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${changeColor}`}
        >
          <ChangeIcon size={10} strokeWidth={3} />
          <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
