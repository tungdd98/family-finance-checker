"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Search, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface BankOption {
  code: string;
  name: string;
  shortName: string;
}

export const BANK_LIST: BankOption[] = [
  // Ngân hàng thương mại nhà nước
  {
    code: "VCB",
    name: "Vietcombank",
    shortName: "Ngân hàng TMCP Ngoại thương Việt Nam",
  },
  {
    code: "BID",
    name: "BIDV",
    shortName: "Ngân hàng Đầu tư và Phát triển Việt Nam",
  },
  {
    code: "CTG",
    name: "VietinBank",
    shortName: "Ngân hàng Công thương Việt Nam",
  },
  {
    code: "AGR",
    name: "Agribank",
    shortName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn",
  },
  // Ngân hàng thương mại cổ phần lớn
  { code: "MBB", name: "MB Bank", shortName: "Ngân hàng TMCP Quân đội" },
  {
    code: "TCB",
    name: "Techcombank",
    shortName: "Ngân hàng TMCP Kỹ thương Việt Nam",
  },
  { code: "ACB", name: "ACB", shortName: "Ngân hàng TMCP Á Châu" },
  {
    code: "VPB",
    name: "VPBank",
    shortName: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
  },
  {
    code: "STB",
    name: "Sacombank",
    shortName: "Ngân hàng TMCP Sài Gòn Thương Tín",
  },
  {
    code: "HDB",
    name: "HDBank",
    shortName: "Ngân hàng TMCP Phát triển TP. Hồ Chí Minh",
  },
  { code: "VIB", name: "VIB", shortName: "Ngân hàng TMCP Quốc tế Việt Nam" },
  { code: "MSB", name: "MSB", shortName: "Ngân hàng TMCP Hàng Hải Việt Nam" },
  { code: "TPB", name: "TPBank", shortName: "Ngân hàng TMCP Tiên Phong" },
  { code: "OCB", name: "OCB", shortName: "Ngân hàng TMCP Phương Đông" },
  { code: "VAB", name: "VietABank", shortName: "Ngân hàng TMCP Việt Á" },
  {
    code: "EIB",
    name: "Eximbank",
    shortName: "Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam",
  },
  { code: "SHB", name: "SHB", shortName: "Ngân hàng TMCP Sài Gòn – Hà Nội" },
  { code: "SCB", name: "SCB", shortName: "Ngân hàng TMCP Sài Gòn" },
  { code: "NVB", name: "NCB", shortName: "Ngân hàng TMCP Quốc Dân" },
  { code: "SEAB", name: "SeABank", shortName: "Ngân hàng TMCP Đông Nam Á" },
  { code: "BAB", name: "BacABank", shortName: "Ngân hàng TMCP Bắc Á" },
  { code: "KLB", name: "KienLongBank", shortName: "Ngân hàng TMCP Kiên Long" },
  {
    code: "LPB",
    name: "LPBank",
    shortName: "Ngân hàng TMCP Lộc Phát Việt Nam",
  },
  {
    code: "PGB",
    name: "PGBank",
    shortName: "Ngân hàng TMCP Xăng dầu Petrolimex",
  },
  { code: "NASB", name: "BảoViệt Bank", shortName: "Ngân hàng TMCP Bảo Việt" },
  // Ví điện tử & ngân hàng số
  { code: "MOMO", name: "MoMo", shortName: "Ví điện tử MoMo" },
  { code: "ZALOPAY", name: "ZaloPay", shortName: "Ví điện tử ZaloPay" },
  { code: "VNPAY", name: "VNPay", shortName: "Ví điện tử VNPay" },
  {
    code: "VIETTELMONEY",
    name: "Viettel Money",
    shortName: "Ví điện tử Viettel Money",
  },
  { code: "CAKE", name: "Cake by VPBank", shortName: "Ngân hàng số Cake" },
  { code: "TIMO", name: "Timo", shortName: "Ngân hàng số Timo" },
  { code: "UBANK", name: "Ubank by VPBank", shortName: "Ngân hàng số Ubank" },
];

interface Props {
  selectedCode: string;
  selectedName: string;
  onSelect: (code: string, name: string) => void;
  disabled?: boolean;
}

export function BankPicker({
  selectedCode,
  selectedName,
  onSelect,
  disabled,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const filtered = BANK_LIST.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.shortName.toLowerCase().includes(query.toLowerCase()) ||
      b.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full items-center justify-between border px-3.5 disabled:opacity-50"
      >
        <span
          className={`text-sm font-medium ${selectedName ? "text-foreground" : "text-foreground-muted"}`}
        >
          {selectedName || "Chọn ngân hàng / ví điện tử"}
        </span>
        <svg
          className="text-foreground-muted h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className={`bg-surface z-50 flex flex-col transition-all duration-300 ${
              isDesktop
                ? "fixed top-1/2 left-1/2 max-h-[90dvh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                : "fixed inset-x-0 bottom-0 h-[92dvh] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <Dialog.Title className="text-foreground text-base font-bold">
                Chọn Ngân Hàng
              </Dialog.Title>
              <Dialog.Close className="text-foreground-muted">
                <X size={20} />
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="bg-background border-border flex h-10 items-center gap-2 border px-3">
                <Search size={14} className="text-foreground-muted shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm ngân hàng..."
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {filtered.length === 0 && (
                <p className="text-foreground-muted py-4 text-center text-sm">
                  Không tìm thấy ngân hàng
                </p>
              )}
              {filtered.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => {
                    onSelect(b.code, b.name);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`border-border flex w-full items-center gap-3 border-b py-3.5 last:border-b-0 ${
                    b.code === selectedCode ? "text-accent" : "text-foreground"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${b.code === selectedCode ? "bg-accent" : "bg-foreground-muted"}`}
                  />
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-medium">{b.name}</span>
                    <span className="text-foreground-muted text-xs">
                      {b.shortName}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
