// src/app/(protected)/settings/ResetDataSection.tsx
"use client";

import { useState, useTransition } from "react";
import { Trash2, TriangleAlert, X, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

import { resetAllDataAction, type ResetTable } from "@/app/actions/settings";

interface DataCategory {
  key: ResetTable;
  label: string;
  description: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    key: "savings_accounts",
    label: "Tài khoản tiết kiệm",
    description: "Tất cả khoản gửi tiết kiệm",
  },
  {
    key: "gold_assets",
    label: "Tài sản vàng",
    description: "Tất cả lượng vàng đang nắm giữ",
  },
  {
    key: "goals",
    label: "Mục tiêu tài chính",
    description: "Mục tiêu & dòng tiền hộ gia đình",
  },
  {
    key: "monthly_actuals",
    label: "Dữ liệu thu chi",
    description: "Thu chi thực tế hàng tháng",
  },
  {
    key: "household_cash_flow",
    label: "Dòng tiền trung bình",
    description: "Thu nhập & chi phí trung bình",
  },
  {
    key: "user_settings",
    label: "Cài đặt tài khoản",
    description: "Tên hiển thị & số dư ban đầu",
  },
];

interface Props {
  displayName: string;
}

export function ResetDataSection({ displayName }: Readonly<Props>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sheet, setSheet] = useState<"closed" | "confirm" | "type">("closed");
  const [selected, setSelected] = useState<Set<ResetTable>>(new Set());
  const [typed, setTyped] = useState("");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const KEYWORD = "RESET";
  const isUnlocked = typed.trim().toUpperCase() === KEYWORD;
  const selectedCount = selected.size;
  const allSelected = selectedCount === DATA_CATEGORIES.length;

  const toggleItem = (key: ResetTable) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(DATA_CATEGORIES.map((c) => c.key)));
    }
  };

  const handleReset = () => {
    startTransition(async () => {
      const tables = Array.from(selected);
      const result = await resetAllDataAction(tables);
      if (result?.error) {
        toast.error(result.error);
      } else {
        const count = tables.length;
        toast.success(`Đã xóa ${count} mục dữ liệu`);
        setSheet("closed");
        setSelected(new Set());
        setTyped("");
        router.refresh();
      }
    });
  };

  const handleOpen = () => {
    setSelected(new Set());
    setTyped("");
    setSheet("confirm");
  };

  const handleClose = () => {
    setSheet("closed");
    setSelected(new Set());
    setTyped("");
  };

  const handleContinue = () => {
    if (selectedCount === 0) {
      toast.error("Vui lòng chọn ít nhất 1 mục để xóa");
      return;
    }
    setTyped("");
    setSheet("type");
  };

  return (
    <>
      {/* Trigger button */}
      <button
        id="reset-data-btn"
        type="button"
        onClick={handleOpen}
        className="border-status-negative/20 text-status-negative hover:bg-status-negative/10 flex h-14 w-full items-center justify-center gap-2 border text-sm font-bold transition-colors"
      >
        <Trash2 size={16} />
        XÓA DỮ LIỆU
      </button>

      {/* ── Sheet 1: Select categories ── */}
      <Dialog.Root
        open={sheet === "confirm"}
        onOpenChange={(o) => !o && handleClose()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className={`bg-surface z-50 flex flex-col transition-all duration-300 ${
              isDesktop
                ? "fixed top-1/2 left-1/2 max-h-[90dvh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                : "fixed inset-x-0 bottom-0 rounded-t-2xl ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
            } border-border border-t`}
          >
            <div className="flex flex-col gap-5 px-5 pt-6 pb-10">
              {/* Handle */}
              <div className="bg-border-strong mx-auto h-1 w-10 rounded-full lg:hidden" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <TriangleAlert
                      size={18}
                      className="text-status-negative shrink-0"
                    />
                    <span className="text-status-negative text-sm font-semibold">
                      CẢNH BÁO
                    </span>
                  </div>
                  <Dialog.Title className="text-foreground text-base leading-snug font-bold">
                    {displayName}, chọn dữ liệu muốn xóa
                  </Dialog.Title>
                </div>
                <Dialog.Close className="text-foreground-muted hover:text-foreground mt-0.5 shrink-0">
                  <X size={20} />
                </Dialog.Close>
              </div>

              {/* Toggle all + count */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-foreground-secondary hover:text-foreground flex items-center gap-1.5 text-xs font-semibold transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare size={15} className="text-status-negative" />
                  ) : (
                    <Square size={15} />
                  )}
                  {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
                {selectedCount > 0 && (
                  <span className="text-status-negative text-xs font-semibold">
                    {selectedCount}/{DATA_CATEGORIES.length} mục được chọn
                  </span>
                )}
              </div>

              {/* Checkbox list */}
              <div className="border-border flex flex-col gap-0 overflow-hidden border">
                {DATA_CATEGORIES.map((cat, idx) => {
                  const isChecked = selected.has(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => toggleItem(cat.key)}
                      className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        idx < DATA_CATEGORIES.length - 1
                          ? "border-border border-b"
                          : ""
                      } ${isChecked ? "bg-status-negative/8" : "hover:bg-white/3"}`}
                    >
                      {/* Custom checkbox */}
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                          isChecked
                            ? "border-status-negative bg-status-negative"
                            : "border-border-strong bg-transparent"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                            className="shrink-0"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="white"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            isChecked
                              ? "text-status-negative"
                              : "text-foreground"
                          }`}
                        >
                          {cat.label}
                        </span>
                        <span className="text-foreground-muted text-xs">
                          {cat.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Warning note */}
              <p className="text-status-negative text-xs font-semibold">
                Không thể hoàn tác sau khi xóa.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="border-border text-foreground h-12 flex-1 border text-sm font-bold transition-colors hover:bg-white/5"
                >
                  HỦY
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={selectedCount === 0}
                  className={`h-12 flex-1 border text-sm font-bold transition-colors ${
                    selectedCount > 0
                      ? "border-status-negative/30 bg-status-negative/10 text-status-negative hover:bg-status-negative/20"
                      : "border-border text-foreground-muted cursor-not-allowed opacity-40"
                  }`}
                >
                  {selectedCount > 0
                    ? `TIẾP TỤC XÓA (${selectedCount}) →`
                    : "TIẾP TỤC XÓA →"}
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Sheet 2: Type RESET ── */}
      <Dialog.Root
        open={sheet === "type"}
        onOpenChange={(o) => !o && handleClose()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className={`bg-surface z-50 flex flex-col transition-all duration-300 ${
              isDesktop
                ? "fixed top-1/2 left-1/2 max-h-[90dvh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                : "fixed inset-x-0 bottom-0 rounded-t-2xl ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
            } border-border border-t`}
          >
            <div className="flex flex-col gap-6 px-5 pt-6 pb-10">
              {/* Handle */}
              <div className="bg-border-strong mx-auto h-1 w-10 rounded-full lg:hidden" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-status-negative text-sm font-semibold">
                    XÁC NHẬN LẦN CUỐI
                  </span>
                  <Dialog.Title className="text-foreground text-base font-bold">
                    Gõ{" "}
                    <span className="text-status-negative">
                      &ldquo;RESET&rdquo;
                    </span>{" "}
                    để xác nhận xóa {selectedCount} mục
                  </Dialog.Title>
                </div>
                <Dialog.Close className="text-foreground-muted hover:text-foreground mt-0.5 shrink-0">
                  <X size={20} />
                </Dialog.Close>
              </div>

              {/* Selected summary */}
              <div className="bg-status-negative/8 border-status-negative/20 flex flex-col gap-1.5 border p-3.5">
                <span className="text-foreground-secondary text-xs font-semibold">
                  SẼ XÓA:
                </span>
                {DATA_CATEGORIES.filter((c) => selected.has(c.key)).map((c) => (
                  <span
                    key={c.key}
                    className="text-status-negative flex items-center gap-2 text-xs font-medium"
                  >
                    <span className="bg-status-negative h-1 w-1 shrink-0 rounded-full" />
                    {c.label}
                  </span>
                ))}
              </div>

              {/* Input */}
              <div
                className={`flex h-14 items-center border px-4 transition-colors ${
                  isUnlocked
                    ? "border-status-negative bg-status-negative/5"
                    : "border-border bg-background"
                }`}
              >
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Nhập RESET..."
                  autoComplete="off"
                  autoCorrect="off"
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm font-bold outline-none placeholder:font-normal"
                />
              </div>

              {/* Delete button */}
              <button
                id="confirm-reset-btn"
                type="button"
                disabled={!isUnlocked || isPending}
                onClick={handleReset}
                className={`h-14 w-full text-sm font-bold transition-all duration-200 ${
                  isUnlocked && !isPending
                    ? "bg-status-negative text-white opacity-100 active:scale-[0.98]"
                    : "bg-status-negative/20 text-status-negative/40 cursor-not-allowed opacity-60"
                }`}
              >
                {isPending ? "ĐANG XÓA..." : `XÓA ${selectedCount} MỤC DỮ LIỆU`}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
