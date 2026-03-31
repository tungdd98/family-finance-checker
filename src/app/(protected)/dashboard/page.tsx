// src/app/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  cachedGetActiveGoldAssets,
  cachedGetAllGoldAssets,
  cachedGetSavingsAccounts,
  cachedGetGoal,
  cachedGetCashFlow,
  cachedGetSettings,
  cachedGetMonthlyActual,
  getExternalGoldPrices,
} from "@/lib/server-queries";
import type { RecentTx } from "@/types/transactions";
import { calcAccruedInterest } from "@/lib/services/savings";
import { calcProjection } from "@/lib/services/goals";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Calculate previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [
    goldPositions,
    allGoldAssets,
    prices,
    savingsAccounts,
    goal,
    cashFlow,
    settings,
    currentMonthActual,
    prevMonthActual,
  ] = await Promise.all([
    cachedGetActiveGoldAssets(user.id),
    cachedGetAllGoldAssets(user.id),
    getExternalGoldPrices(),
    cachedGetSavingsAccounts(user.id),
    cachedGetGoal(user.id),
    cachedGetCashFlow(user.id),
    cachedGetSettings(user.id),
    cachedGetMonthlyActual(user.id, year, month),
    cachedGetMonthlyActual(user.id, prevYear, prevMonth),
  ]);

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

  // Assemble recent transactions
  const recentTxs: RecentTx[] = [];

  // Gold buys (all positions)
  for (const pos of allGoldAssets) {
    recentTxs.push({
      kind: "gold_buy",
      label: `${pos.brand_name} ${pos.quantity} chỉ`,
      amount: pos.quantity * pos.buy_price_per_chi,
      date: pos.buy_date,
      note: pos.note,
    });
  }

  // Gold sells (only sold positions)
  for (const pos of allGoldAssets.filter((p) => p.sold_at !== null)) {
    recentTxs.push({
      kind: "gold_sell",
      label: `${pos.brand_name} ${pos.sold_quantity} chỉ`,
      amount: pos.sold_quantity * (pos.sell_price_per_chi ?? 0),
      date: pos.sold_at!,
      note: pos.note,
    });
  }

  // Savings accounts
  for (const acc of savingsAccounts) {
    recentTxs.push({
      kind: "savings",
      label: `${acc.bank_name}${acc.account_name ? " · " + acc.account_name : ""}`,
      amount: acc.principal,
      date: acc.start_date,
      note: acc.note,
    });
  }

  // Current month income/expense
  if (currentMonthActual) {
    const currentMonthDate = `${year}-${String(month).padStart(2, "0")}-01`;
    for (const detail of currentMonthActual.income_details) {
      recentTxs.push({
        kind: "income",
        label: detail.type,
        amount: detail.amount,
        date: currentMonthDate,
      });
    }
    for (const detail of currentMonthActual.expense_details) {
      recentTxs.push({
        kind: "expense",
        label: detail.type,
        amount: detail.amount,
        date: currentMonthDate,
      });
    }
  }

  // Previous month income/expense
  if (prevMonthActual) {
    const prevMonthDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    for (const detail of prevMonthActual.income_details) {
      recentTxs.push({
        kind: "income",
        label: detail.type,
        amount: detail.amount,
        date: prevMonthDate,
      });
    }
    for (const detail of prevMonthActual.expense_details) {
      recentTxs.push({
        kind: "expense",
        label: detail.type,
        amount: detail.amount,
        date: prevMonthDate,
      });
    }
  }

  // Sort by date descending, take top 8
  const recentTxsSorted = recentTxs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <DashboardClient
      goldPositions={goldPositions}
      initialPrices={prices}
      savingsAccounts={savingsAccounts}
      goal={goal}
      goalProjection={goalProjection}
      monthlyActual={currentMonthActual}
      currentAssets={currentAssets}
      recentTxs={recentTxsSorted}
    />
  );
}
