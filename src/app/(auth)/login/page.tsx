"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    form.clearErrors("root");
    startTransition(async () => {
      const result = await loginAction(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-7">
      <div className="bg-surface w-full max-w-sm px-8 py-10">
        {/* Header */}
        <div className="mb-7 flex flex-col items-center gap-4">
          <div className="bg-accent h-8 w-8" />
          <h1 className="text-foreground text-center text-[28px] font-bold tracking-[-1px]">
            FAMILY FINANCE
          </h1>
          <p className="text-foreground-secondary text-center text-[11px] font-medium tracking-[2px]">
            QUẢN LÝ TÀI SẢN GIA ĐÌNH
          </p>
          <div className="bg-accent h-px w-full" />
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-foreground-muted flex items-center gap-2 text-[11px] font-semibold tracking-[1.5px]"
              >
                <span className="bg-accent h-3.5 w-0.75 shrink-0" />
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                disabled={isPending}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-foreground-muted flex items-center gap-2 text-[11px] font-semibold tracking-[1.5px]"
              >
                <span className="bg-accent h-3.5 w-0.75 shrink-0" />
                MẬT KHẨU
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isPending}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Root error */}
            {form.formState.errors.root && (
              <p className="border-status-negative text-status-negative border px-4 py-3 text-[12px]">
                {form.formState.errors.root.message}
              </p>
            )}

            {/* Submit */}
            <Button type="submit" disabled={isPending} className="mt-2 h-14">
              {isPending ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
