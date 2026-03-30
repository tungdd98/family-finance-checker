import { createClient } from "@/lib/supabase/server";
import {
  cachedGetActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/server-queries";
import { GoldClient } from "./GoldClient";

export default async function GoldPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [positions, prices] = await Promise.all([
    user ? cachedGetActiveGoldAssets(user.id) : [],
    getExternalGoldPrices(),
  ]);

  return <GoldClient initialPositions={positions} initialPrices={prices} />;
}
