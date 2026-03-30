// src/app/actions/gold.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addAssetSchema,
  editAssetSchema,
  sellAssetSchema,
  type AddAssetInput,
  type EditAssetInput,
  type SellAssetInput,
} from "@/lib/validations/gold";
import {
  addGoldAsset,
  editGoldAsset,
  sellGoldAsset,
  deleteGoldAsset,
} from "@/lib/services/gold";

type ActionResult = { error: string } | undefined;

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addAssetAction(
  data: AddAssetInput
): Promise<ActionResult> {
  const parsed = addAssetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await addGoldAsset(supabase, user.id, parsed.data);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể lưu tài sản" };
  }
}

export async function editAssetAction(
  id: string,
  data: EditAssetInput
): Promise<ActionResult> {
  const parsed = editAssetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await editGoldAsset(supabase, user.id, id, parsed.data);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể cập nhật tài sản" };
  }
}

export async function sellAssetAction(
  id: string,
  data: SellAssetInput
): Promise<ActionResult> {
  const parsed = sellAssetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await sellGoldAsset(supabase, user.id, id, parsed.data);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("exceeds available")) {
      return { error: "Số lượng bán vượt quá số lượng đang nắm giữ" };
    }
    return { error: "Không thể bán tài sản" };
  }
}

export async function deleteAssetAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await deleteGoldAsset(supabase, user.id, id);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể xóa tài sản" };
  }
}
