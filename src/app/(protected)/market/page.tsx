import { getExternalGoldPrices } from "@/lib/services/gold";
import { MarketClient } from "./MarketClient";

export default async function MarketPage() {
  const prices = await getExternalGoldPrices();
  return <MarketClient initialPrices={prices} />;
}
