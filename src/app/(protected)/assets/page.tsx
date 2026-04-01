import { createClient } from "@/lib/supabase/server";
import {
  cachedGetSavingsAccounts,
  cachedGetActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/server-queries";
import { calcAccruedInterest } from "@/lib/services/savings";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { AssetsClient } from "./AssetsClient";

export default async function AssetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [savingsAccounts, goldPositions, prices] = await Promise.all([
    cachedGetSavingsAccounts(user.id),
    cachedGetActiveGoldAssets(user.id),
    getExternalGoldPrices(),
  ]);

  const savingsTotal = savingsAccounts.reduce(
    (s, a) => s + a.principal + calcAccruedInterest(a),
    0
  );

  const priceMap = new Map((prices ?? []).map((p) => [p.type_code, p]));
  const goldTotal = goldPositions.reduce((s, pos) => {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    if (!livePrice) return s;
    return (
      s +
      calcPnl(remaining, pos.buy_price_per_chi, livePrice.sell / CHI_PER_LUONG)
        .currentValue
    );
  }, 0);

  const goldCost = goldPositions.reduce((s, pos) => {
    const remaining = pos.quantity - pos.sold_quantity;
    return s + pos.buy_price_per_chi * remaining;
  }, 0);

  const savingsPrincipal = savingsAccounts.reduce((s, a) => s + a.principal, 0);

  return (
    <AssetsClient
      savingsTotal={savingsTotal}
      goldTotal={goldTotal}
      goldCost={goldCost}
      savingsPrincipal={savingsPrincipal}
    />
  );
}
