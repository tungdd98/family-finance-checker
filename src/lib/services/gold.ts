// src/lib/services/gold.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AddAssetInput,
  EditAssetInput,
  SellAssetInput,
} from "@/lib/validations/gold";

export interface GoldAsset {
  id: string;
  user_id: string;
  brand_code: string;
  brand_name: string;
  quantity: number;
  buy_price_per_chi: number;
  buy_date: string;
  note: string | null;
  sold_quantity: number;
  sell_price_per_chi: number | null;
  sold_at: string | null;
  created_at: string;
}

export interface GoldPrice {
  type_code: string;
  name: string;
  buy: number;
  sell: number;
  change_buy: number;
  change_sell: number;
  update_time: string;
}

export async function getActiveGoldAssets(
  supabase: SupabaseClient,
  userId: string
): Promise<GoldAsset[]> {
  const { data, error } = await supabase
    .from("gold_assets")
    .select("*")
    .eq("user_id", userId)
    .is("sold_at", null)
    .order("buy_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllGoldAssets(
  supabase: SupabaseClient,
  userId: string
): Promise<GoldAsset[]> {
  const { data, error } = await supabase
    .from("gold_assets")
    .select("*")
    .eq("user_id", userId)
    .order("buy_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  input: AddAssetInput
): Promise<void> {
  const { error } = await supabase.from("gold_assets").insert({
    user_id: userId,
    brand_code: input.brand_code,
    brand_name: input.brand_name,
    quantity: input.quantity,
    buy_price_per_chi: input.buy_price_per_chi,
    buy_date: input.buy_date,
    note: input.note ?? null,
  });
  if (error) throw error;
}

export async function editGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: EditAssetInput
): Promise<void> {
  const { error } = await supabase
    .from("gold_assets")
    .update({
      brand_code: input.brand_code,
      brand_name: input.brand_name,
      quantity: input.quantity,
      buy_price_per_chi: input.buy_price_per_chi,
      buy_date: input.buy_date,
      note: input.note ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function sellGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: SellAssetInput
): Promise<void> {
  const { error } = await supabase.rpc("sell_gold_asset", {
    p_user_id: userId,
    p_asset_id: id,
    p_sell_quantity: input.sell_quantity,
    p_sell_price_per_chi: input.sell_price_per_chi,
  });
  if (error) throw error;
}

export async function deleteGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("gold_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

const UA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export async function getExternalGoldPrices(): Promise<GoldPrice[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const [todayRes, yesterdayRes] = await Promise.all([
      fetch("https://www.vang.today/api/prices", {
        headers: UA_HEADERS,
        next: { revalidate: 300 },
      }),
      fetch(`https://www.vang.today/api/prices?date=${yesterdayStr}`, {
        headers: UA_HEADERS,
        next: { revalidate: 300 },
      }),
    ]);

    if (!todayRes.ok) return [];

    const rawData = await todayRes.json();
    const yesterdayData = yesterdayRes.ok ? await yesterdayRes.json() : null;

    // Build yesterday price map for day-over-day delta
    const yp: Record<string, { buy: number; sell: number }> = {};
    if (yesterdayData?.prices && typeof yesterdayData.prices === "object") {
      for (const [code, infoRaw] of Object.entries(yesterdayData.prices)) {
        const info = infoRaw as { buy?: number; sell?: number };
        yp[code] = { buy: info.buy ?? 0, sell: info.sell ?? 0 };
      }
    }

    const pricesArray: GoldPrice[] = [];
    if (rawData.prices && typeof rawData.prices === "object") {
      const updateTime = `${rawData.date} ${rawData.time}`;
      for (const [code, infoRaw] of Object.entries(rawData.prices)) {
        const info = infoRaw as {
          name?: string;
          buy?: number;
          sell?: number;
          change_buy?: number;
          change_sell?: number;
        };
        const buy = info.buy ?? 0;
        const sell = info.sell ?? 0;
        const prev = yp[code];
        pricesArray.push({
          type_code: code,
          name: info.name ?? code,
          buy,
          sell,
          // Use day-over-day delta; fall back to API value if yesterday unavailable
          change_buy: prev ? buy - prev.buy : (info.change_buy ?? 0),
          change_sell: prev ? sell - prev.sell : (info.change_sell ?? 0),
          update_time: updateTime,
        });
      }
    }
    return pricesArray;
  } catch (error) {
    console.error("Fetch prices error:", error);
    return [];
  }
}
