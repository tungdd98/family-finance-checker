// src/app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export async function loginAction(
  data: LoginInput
): Promise<{ error: string } | never> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Dữ liệu không hợp lệ." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  redirect("/dashboard");
}
