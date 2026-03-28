// src/app/(protected)/gold/components/AddEditAssetSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { addAssetSchema, type AddAssetInput } from "@/lib/validations/gold";
import { addAssetAction, editAssetAction } from "@/app/actions/gold";
import { convertInputToChiAndPrice, formatVND } from "@/lib/gold-utils";
import { BrandPicker } from "./BrandPicker";
import { DatePickerDrawer } from "./DatePickerDrawer";
import { Button } from "@/components/ui/button";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          {/* Header */}
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {mode === "add" ? "Thêm tài sản" : "Sửa tài sản"}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

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
                    className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                </div>
                <div className="bg-surface border-border flex h-12 items-center border">
                  <button
                    type="button"
                    onClick={() => setUnit("chi")}
                    className={`h-full px-3 py-2 text-[11px] font-bold tracking-[1px] transition-colors ${
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
                    className={`h-full px-3 py-2 text-[11px] font-bold tracking-[1px] transition-colors ${
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
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
              {totalVnd > 0 && (
                <p className="text-foreground-muted text-right text-[12px]">
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
                  <DatePickerDrawer
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
                  className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("note")}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending
                ? "ĐANG LƯU..."
                : mode === "add"
                  ? "LƯU TÀI SẢN"
                  : "CẬP NHẬT TÀI SẢN"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
      {children}
    </span>
  );
}

function ErrorMsg({ children }: { children: ReactNode }) {
  return <p className="text-status-negative text-[11px]">{children}</p>;
}
