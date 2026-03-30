// src/app/actions/savings.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addSavingsAccount,
  updateSavingsAccount,
  deleteSavingsAccount,
} from "@/lib/services/savings";
import { savingsSchema, type SavingsInput } from "@/lib/validations/savings";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function addSavingsAction(
  input: SavingsInput
): Promise<{ error?: string } | void> {
  try {
    const parsed = savingsSchema.safeParse(input);
    if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

    const { supabase, user } = await getAuthUser();
    await addSavingsAccount(supabase, user.id, parsed.data);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/savings");
  } catch {
    return { error: "Đã xảy ra lỗi, vui lòng thử lại" };
  }
}

export async function updateSavingsAction(
  id: string,
  input: SavingsInput
): Promise<{ error?: string } | void> {
  try {
    const parsed = savingsSchema.safeParse(input);
    if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

    const { supabase, user } = await getAuthUser();
    await updateSavingsAccount(supabase, user.id, id, parsed.data);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/savings");
  } catch {
    return { error: "Đã xảy ra lỗi, vui lòng thử lại" };
  }
}

export async function deleteSavingsAction(
  id: string
): Promise<{ error?: string } | void> {
  try {
    const { supabase, user } = await getAuthUser();
    await deleteSavingsAccount(supabase, user.id, id);
    revalidateTag(`user-${user.id}`);
    revalidatePath("/savings");
  } catch {
    return { error: "Đã xảy ra lỗi, vui lòng thử lại" };
  }
}
