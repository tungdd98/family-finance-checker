// src/lib/validations/gold.ts
import { z } from "zod";

export const addAssetSchema = z.object({
  brand_code: z.string().min(1, "Vui lòng chọn thương hiệu vàng"),
  brand_name: z.string().min(1),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  buy_price_per_chi: z.number().int().positive("Giá mua phải lớn hơn 0"),
  buy_date: z.string().min(1, "Vui lòng chọn ngày mua"),
  note: z.string().optional(),
});

export type AddAssetInput = z.infer<typeof addAssetSchema>;

export const editAssetSchema = addAssetSchema;
export type EditAssetInput = z.infer<typeof editAssetSchema>;

export const sellAssetSchema = z.object({
  sell_quantity: z.number().positive("Số lượng bán phải lớn hơn 0"),
  sell_price_per_chi: z.number().int().positive("Giá bán phải lớn hơn 0"),
  sell_date: z.string().min(1, "Vui lòng chọn ngày bán"),
});

export type SellAssetInput = z.infer<typeof sellAssetSchema>;
