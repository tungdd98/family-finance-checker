import { createClient } from "@/lib/supabase/server";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { GoldClient } from "./GoldClient";

export default async function GoldPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [positions, prices] = await Promise.all([
    user ? getActiveGoldAssets(supabase, user.id) : [],
    getExternalGoldPrices(),
  ]);

  return <GoldClient initialPositions={positions} initialPrices={prices} />;
}
