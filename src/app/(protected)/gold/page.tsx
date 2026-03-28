// src/app/(protected)/gold/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveGoldAssets } from "@/lib/services/gold";
import { GoldClient } from "./GoldClient";

export default async function GoldPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const positions = user ? await getActiveGoldAssets(supabase, user.id) : [];

  return <GoldClient initialPositions={positions} />;
}
