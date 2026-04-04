// src/app/(protected)/gold/components/AddEditAssetSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addAssetSchema, type AddAssetInput } from "@/lib/validations/gold";
import { addAssetAction, editAssetAction } from "@/app/actions/gold";
import { convertInputToChiAndPrice, formatVND } from "@/lib/gold-utils";
import { BrandPicker } from "./BrandPicker";
import { Button } from "@/components/ui/button";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { ResponsiveModal, ResponsiveDatePicker } from "@/components/common";

interface Props {
  mode: "add" | "edit";
  position?: GoldAsset;
  prices: GoldPrice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Unit = "chi" | "luong";

export function AddEditAssetSheet({
  mode,
  position,
  prices,
  open,
  onOpenChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>("chi");
  const [priceDisplay, setPriceDisplay] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<AddAssetInput>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      brand_code: position?.brand_code ?? "",
      brand_name: position?.brand_name ?? "",
      quantity: position ? position.quantity : undefined,
      buy_price_per_chi: position?.buy_price_per_chi,
      buy_date: position?.buy_date ?? today,
      note: position?.note ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && position) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPriceDisplay(
          new Intl.NumberFormat("vi-VN").format(position.buy_price_per_chi)
        );
        form.reset({
          brand_code: position.brand_code,
          brand_name: position.brand_name,
          quantity: position.quantity,
          buy_price_per_chi: position.buy_price_per_chi,
          buy_date: position.buy_date,
          note: position.note ?? "",
        });
      } else {
        setPriceDisplay("");
        form.reset({
          brand_code: "",
          brand_name: "",
          quantity: undefined,
          buy_price_per_chi: undefined,
          buy_date: today,
          note: "",
        });
      }
    }
  }, [open, mode, position, form, today]);

  const brandCode = useWatch({ control: form.control, name: "brand_code" });
  const brandName = useWatch({ control: form.control, name: "brand_name" });
  const rawQty = useWatch({ control: form.control, name: "quantity" }) ?? 0;
  const rawPrice =
    useWatch({ control: form.control, name: "buy_price_per_chi" }) ?? 0;
  const totalVnd =
    rawQty > 0 && rawPrice > 0
      ? (() => {
          const { quantityChi, pricePerChi } = convertInputToChiAndPrice(
            rawQty,
            rawPrice,
            unit
          );
          return quantityChi * pricePerChi;
        })()
      : 0;

  const onSubmit = (data: AddAssetInput) => {
    const { quantityChi, pricePerChi } = convertInputToChiAndPrice(
      data.quantity,
      data.buy_price_per_chi,
      unit
    );

    const payload: AddAssetInput = {
      ...data,
      quantity: quantityChi,
      buy_price_per_chi: pricePerChi,
    };

    startTransition(async () => {
      const result =
        mode === "add"
          ? await addAssetAction(payload)
          : await editAssetAction(position!.id, payload);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          mode === "add" ? "Đã thêm tài sản" : "Đã cập nhật tài sản"
        );
        router.refresh();
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "add" ? "Thêm tài sản" : "Sửa tài sản"}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5 px-7 py-5 pb-10"
      >
        {/* Brand picker */}
        <div className="flex flex-col gap-2">
          <Label>CHỌN THƯƠNG HIỆU VÀNG</Label>
          <Controller
            name="brand_code"
            control={form.control}
            render={({ field }) => (
              <BrandPicker
                prices={prices}
                selectedCode={brandCode}
                selectedName={brandName}
                onSelect={(code, name) => {
                  field.onChange(code);
                  form.setValue("brand_name", name);
                }}
              />
            )}
          />
          {form.formState.errors.brand_code && (
            <ErrorMsg>{form.formState.errors.brand_code.message}</ErrorMsg>
          )}
        </div>

        {/* Quantity + unit toggle */}
        <div className="flex flex-col gap-2">
          <Label>SỐ LƯỢNG</Label>
          <div className="flex items-center gap-2">
            <div className="bg-background border-border flex h-12 flex-1 items-center border px-3.5">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder={unit === "chi" ? "VD: 5" : "VD: 0.5"}
                disabled={isPending}
                className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
                {...form.register("quantity", { valueAsNumber: true })}
              />
            </div>
            <div className="bg-surface border-border flex h-12 items-center border">
              <button
                type="button"
                onClick={() => setUnit("chi")}
                className={`h-full px-3 py-2 text-xs font-bold transition-colors ${
                  unit === "chi"
                    ? "bg-accent text-background"
                    : "text-foreground-muted"
                }`}
              >
                CHỈ
              </button>
              <button
                type="button"
                onClick={() => setUnit("luong")}
                className={`h-full px-3 py-2 text-xs font-bold transition-colors ${
                  unit === "luong"
                    ? "bg-accent text-background"
                    : "text-foreground-muted"
                }`}
              >
                LƯỢNG
              </button>
            </div>
          </div>
          {form.formState.errors.quantity && (
            <ErrorMsg>{form.formState.errors.quantity.message}</ErrorMsg>
          )}
        </div>

        {/* Buy price */}
        <div className="flex flex-col gap-2">
          <Label>GIÁ MỖI {unit === "chi" ? "CHỈ" : "LƯỢNG"} (VND)</Label>
          <div className="bg-background border-border flex h-12 items-center border px-3.5">
            <input
              inputMode="numeric"
              placeholder="VD: 17.000.000"
              value={priceDisplay}
              disabled={isPending}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const num = raw ? parseInt(raw, 10) : 0;
                setPriceDisplay(
                  raw ? new Intl.NumberFormat("vi-VN").format(num) : ""
                );
                form.setValue("buy_price_per_chi", num, {
                  shouldValidate: true,
                });
              }}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
            />
            <span className="text-foreground-muted shrink-0 text-sm">₫</span>
          </div>
          {totalVnd > 0 && (
            <p className="text-foreground-muted text-right text-xs">
              Tổng: {formatVND(totalVnd)}
            </p>
          )}
          {form.formState.errors.buy_price_per_chi && (
            <ErrorMsg>
              {form.formState.errors.buy_price_per_chi.message}
            </ErrorMsg>
          )}
        </div>

        {/* Buy date */}
        <div className="flex flex-col gap-2">
          <Label>NGÀY MUA</Label>
          <Controller
            name="buy_date"
            control={form.control}
            render={({ field }) => (
              <ResponsiveDatePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
          {form.formState.errors.buy_date && (
            <ErrorMsg>{form.formState.errors.buy_date.message}</ErrorMsg>
          )}
        </div>

        {/* Note */}
        <div className="flex flex-col gap-2">
          <Label>GHI CHÚ (TÙY CHỌN)</Label>
          <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
            <textarea
              placeholder="Mua tại SJC Lý Thường Kiệt..."
              disabled={isPending}
              rows={3}
              className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-sm font-medium outline-none disabled:opacity-50"
              {...form.register("note")}
            />
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
          {isPending
            ? "ĐANG LƯU..."
            : mode === "add"
              ? "LƯU TÀI SẢN"
              : "CẬP NHẬT TÀI SẢN"}
        </Button>
      </form>
    </ResponsiveModal>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-foreground-muted text-xs font-semibold">
      {children}
    </span>
  );
}

function ErrorMsg({ children }: { children: ReactNode }) {
  return <p className="text-status-negative text-xs">{children}</p>;
}
