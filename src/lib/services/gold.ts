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
    .order("created_at", { ascending: false });
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
