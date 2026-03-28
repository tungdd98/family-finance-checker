import { createClient } from "@/lib/supabase/server";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { getSavingsAccounts } from "@/lib/services/savings";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [goldPositions, prices, savingsAccounts] = await Promise.all([
    getActiveGoldAssets(supabase, user.id),
    getExternalGoldPrices(),
    getSavingsAccounts(supabase, user.id),
  ]);

  return (
    <DashboardClient
      goldPositions={goldPositions}
      initialPrices={prices}
      savingsAccounts={savingsAccounts}
    />
  );
}
