export const EXPENSE_CATEGORIES = [
  { value: "Ăn uống / Đi chợ", label: "Ăn uống / Đi chợ" },
  { value: "Tiền nhà / Thuê nhà", label: "Tiền nhà / Thuê nhà" },
  { value: "Điện nước / Internet", label: "Điện nước / Internet" },
  { value: "Xăng xe / Đi lại", label: "Xăng xe / Đi lại" },
  { value: "Con cái / Giáo dục", label: "Con cái / Giáo dục" },
  { value: "Hiếu hỉ / Quà tặng", label: "Hiếu hỉ / Quà tặng" },
  { value: "Sức khỏe / Bảo hiểm", label: "Sức khỏe / Bảo hiểm" },
  { value: "Mua sắm / Giải trí", label: "Mua sắm / Giải trí" },
  { value: "Khác", label: "Khác" },
];

export const INCOME_CATEGORIES = [
  { value: "Lương Chồng", label: "Lương Chồng" },
  { value: "Lương Vợ", label: "Lương Vợ" },
  { value: "Thưởng", label: "Thưởng" },
  { value: "Thu nhập ngoài", label: "Thu nhập ngoài" },
  { value: "Khác", label: "Khác" },
];

export function formatMil(value: number): string {
  const mil = value / 1_000_000;
  return mil % 1 === 0 ? mil.toFixed(0) : mil.toFixed(1);
}
