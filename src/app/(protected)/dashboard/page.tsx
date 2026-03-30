import { createClient } from "@/lib/supabase/server";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import {
  getSavingsAccounts,
  calcAccruedInterest,
} from "@/lib/services/savings";
import { getGoal, getCashFlow, calcProjection } from "@/lib/services/goals";
import { getSettings } from "@/lib/services/settings";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [goldPositions, prices, savingsAccounts, goal, cashFlow, settings] =
    await Promise.all([
      getActiveGoldAssets(user.id),
      getExternalGoldPrices(),
      getSavingsAccounts(user.id),
      getGoal(user.id),
      getCashFlow(user.id),
      getSettings(user.id),
    ]);

  // Compute current assets for goal projection
  const priceMap = new Map((prices ?? []).map((p) => [p.type_code, p]));
  const savingsTotal = savingsAccounts.reduce(
    (s, a) => s + a.principal + calcAccruedInterest(a),
    0
  );
  const goldTotal = goldPositions.reduce((s, pos) => {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    if (livePrice) {
      return (
        s +
        calcPnl(
          remaining,
          pos.buy_price_per_chi,
          livePrice.sell / CHI_PER_LUONG
        ).currentValue
      );
    }
    return s + remaining * pos.buy_price_per_chi;
  }, 0);
  const cashBalance = settings?.initial_cash_balance ?? 0;
  const currentAssets = savingsTotal + goldTotal + cashBalance;
  const goalProjection = goal
    ? calcProjection(goal, cashFlow, currentAssets)
    : null;

  return (
    <DashboardClient
      goldPositions={goldPositions}
      initialPrices={prices}
      savingsAccounts={savingsAccounts}
      goal={goal}
      goalProjection={goalProjection}
    />
  );
}
