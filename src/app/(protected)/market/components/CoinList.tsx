import type { CoinPrice } from "@/lib/services/coin";
import { filterCoins } from "@/lib/coin-utils";
import { CoinRow } from "./CoinRow";

interface Props {
  coins: CoinPrice[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
}

export function CoinList({
  coins,
  searchQuery,
  onSearchChange,
  isLoading,
}: Props) {
  const filtered = filterCoins(coins, searchQuery);

  return (
    <div className="flex h-full flex-col gap-3">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm theo tên hoặc ký hiệu..."
        className="border-border bg-surface text-foreground placeholder:text-foreground-muted w-full shrink-0 border px-4 py-2.5 text-sm outline-none"
      />
      <div className="border-border bg-surface flex flex-1 flex-col overflow-hidden border">
        {isLoading ? (
          <div className="divide-border flex flex-col divide-y overflow-y-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="border-border bg-border h-8 w-8 animate-pulse rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <div className="border-border bg-border h-3.5 w-24 animate-pulse" />
                    <div className="border-border bg-border h-3 w-12 animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="border-border bg-border h-3.5 w-20 animate-pulse" />
                  <div className="border-border bg-border h-3 w-12 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-border flex flex-1 flex-col divide-y overflow-y-auto">
            {filtered.map((coin) => (
              <CoinRow key={coin.id} coin={coin} />
            ))}
          </div>
        ) : coins.length > 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="type-body text-foreground-muted">
              Không tìm thấy coin
            </span>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="type-body text-foreground-muted">
              Không có dữ liệu
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
