import { getExternalGoldPrices } from "@/lib/services/gold";
import { MarketClient } from "./MarketClient";

export default async function MarketPage() {
  const prices = await getExternalGoldPrices();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          THỊ TRƯỜNG VÀNG
        </h1>
        <p className="text-foreground-muted text-[13px]">
          Giá vàng trực tuyến từ các thương hiệu hàng đầu
        </p>
      </div>

      <MarketClient initialPrices={prices} />
    </div>
  );
}
