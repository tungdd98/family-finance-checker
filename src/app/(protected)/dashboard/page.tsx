import { createClient } from "@/lib/supabase/server";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [goldPositions, prices] = await Promise.all([
    user ? getActiveGoldAssets(supabase, user.id) : [],
    getExternalGoldPrices(),
  ]);

  return (
    <DashboardClient goldPositions={goldPositions} initialPrices={prices} />
  );
}
