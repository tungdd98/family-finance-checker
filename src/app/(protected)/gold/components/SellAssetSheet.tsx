// src/app/(protected)/gold/components/SellAssetSheet.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { sellAssetSchema, type SellAssetInput } from "@/lib/validations/gold";
import { sellAssetAction } from "@/app/actions/gold";
import { Button } from "@/components/ui/button";
import { DatePickerDrawer } from "./DatePickerDrawer";
import type { GoldAsset } from "@/lib/services/gold";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SellAssetSheet({ position, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [priceDisplay, setPriceDisplay] = useState("");

  const form = useForm<SellAssetInput>({
    resolver: zodResolver(sellAssetSchema),
    defaultValues: {
      sell_quantity: undefined,
      sell_price_per_chi: undefined,
    },
  });

  const remaining = position ? position.quantity - position.sold_quantity : 0;

  const onSubmit = (data: SellAssetInput) => {
    if (!position) return;
    startTransition(async () => {
      const result = await sellAssetAction(position.id, data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã bán tài sản");
        router.refresh();
        onOpenChange(false);
        form.reset();
        setPriceDisplay("");
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              Bán tài sản
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          {/* Asset info */}
          <div className="border-border border-b px-7 py-4">
            <p className="text-foreground-secondary text-[13px]">
              {remaining} chỉ {position?.brand_name}
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-7 py-5 pb-10"
          >
            {/* Sell quantity */}
            <div className="flex flex-col gap-2">
              <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
                SỐ LƯỢNG BÁN (CHỈ)
              </span>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={remaining}
                  placeholder={`Tối đa ${remaining} chỉ`}
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("sell_quantity", { valueAsNumber: true })}
                />
              </div>
              {form.formState.errors.sell_quantity && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.sell_quantity.message}
                </p>
              )}
            </div>

            {/* Sell price */}
            <div className="flex flex-col gap-2">
              <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
                GIÁ BÁN MỖI CHỈ (VND)
              </span>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  inputMode="numeric"
                  placeholder="VD: 16.860.000"
                  value={priceDisplay}
                  disabled={isPending}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const num = raw ? parseInt(raw, 10) : 0;
                    setPriceDisplay(
                      raw ? new Intl.NumberFormat("vi-VN").format(num) : ""
                    );
                    form.setValue("sell_price_per_chi", num, {
                      shouldValidate: true,
                    });
                  }}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
              {form.formState.errors.sell_price_per_chi && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.sell_price_per_chi.message}
                </p>
              )}
            </div>

            {/* Sell date */}
            <div className="flex flex-col gap-2">
              <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
                NGÀY BÁN
              </span>
              <Controller
                name="sell_date"
                control={form.control}
                render={({ field }) => (
                  <DatePickerDrawer
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN BÁN"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
