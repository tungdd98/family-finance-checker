import { createClient } from "@/lib/supabase/server";
import {
  getGoal,
  getCashFlow,
  getMonthlyActual,
  calcProjection,
} from "@/lib/services/goals";
import {
  getSavingsAccounts,
  calcAccruedInterest,
} from "@/lib/services/savings";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { getSettings } from "@/lib/services/settings";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { GoalsClient } from "./GoalsClient";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [
    goal,
    cashFlow,
    monthlyActual,
    savingsAccounts,
    goldPositions,
    prices,
    settings,
  ] = await Promise.all([
    getGoal(user.id),
    getCashFlow(user.id),
    getMonthlyActual(user.id, currentYear, currentMonth),
    getSavingsAccounts(user.id),
    getActiveGoldAssets(user.id),
    getExternalGoldPrices(),
    getSettings(user.id),
  ]);

  // Compute current total assets
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

  const projection = goal
    ? calcProjection(goal, cashFlow, currentAssets)
    : null;

  return (
    <GoalsClient
      goal={goal}
      cashFlow={cashFlow}
      monthlyActual={monthlyActual}
      projection={projection}
      currentAssets={currentAssets}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  );
}
