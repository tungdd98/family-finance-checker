// src/app/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveGoldAssets } from "@/lib/services/gold";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const goldPositions = user
    ? await getActiveGoldAssets(supabase, user.id)
    : [];

  return <DashboardClient goldPositions={goldPositions} />;
}
