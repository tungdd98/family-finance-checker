"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Search, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { GoldPrice } from "@/lib/services/gold";

interface Props {
  prices: GoldPrice[];
  selectedCode: string;
  selectedName: string;
  onSelect: (code: string, name: string) => void;
}

export function BrandPicker({
  prices,
  selectedCode,
  selectedName,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const filtered = prices.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(query.toLowerCase())) ||
      p.type_code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full items-center justify-between border px-3.5"
      >
        <span
          className={`text-[13px] font-medium ${selectedName ? "text-foreground" : "text-foreground-muted"}`}
        >
          {selectedName || "Chọn thương hiệu vàng"}
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
          <Dialog.Backdrop className="fixed inset-0 !z-[9999] bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className={`bg-surface !z-[10000] flex flex-col transition-all duration-300 ${
              isDesktop
                ? "fixed top-1/2 left-1/2 max-h-[90dvh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                : "fixed inset-x-0 bottom-0 max-h-[80dvh] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-5 pb-4">
              <Dialog.Title className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
                Chọn Vàng
              </Dialog.Title>
              <Dialog.Close className="text-foreground-muted">
                <X size={20} />
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="px-7 pb-3">
              <div className="bg-background border-border flex h-10 items-center gap-2 border px-3">
                <Search size={14} className="text-foreground-muted shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] outline-none"
                />
              </div>
            </div>

            {/* Brand list */}
            <div className="flex-1 overflow-y-auto px-7 pb-8">
              {filtered.length === 0 && (
                <p className="text-foreground-muted py-4 text-center text-[13px]">
                  Không tìm thấy thương hiệu
                </p>
              )}
              {filtered.map((p) => (
                <button
                  key={p.type_code}
                  type="button"
                  onClick={() => {
                    onSelect(p.type_code, p.name || p.type_code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`border-border flex w-full items-center gap-3 border-b py-3.5 last:border-b-0 ${
                    p.type_code === selectedCode
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.type_code === selectedCode
                        ? "bg-accent"
                        : "bg-foreground-muted"
                    }`}
                  />
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[14px] font-medium">
                      {p.name || p.type_code}
                    </span>
                    <span className="text-foreground-muted text-[11px]">
                      {p.type_code}
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
