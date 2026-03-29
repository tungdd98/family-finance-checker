// src/app/(protected)/settings/ResetDataSection.tsx
"use client";

import { useState, useTransition } from "react";
import { Trash2, TriangleAlert, X, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

export function ResetDataSection({ displayName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sheet, setSheet] = useState<"closed" | "confirm" | "type">("closed");
  const [selected, setSelected] = useState<Set<ResetTable>>(new Set());
  const [typed, setTyped] = useState("");

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
        className="border-status-negative/20 text-status-negative hover:bg-status-negative/10 flex h-14 w-full items-center justify-center gap-2 border text-[13px] font-bold tracking-[1px] transition-colors"
      >
        <Trash2 size={16} />
        XÓA DỮ LIỆU
      </button>

      {/* Overlay */}
      {sheet !== "closed" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* ── Sheet 1: Select categories ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl transition-transform duration-300 ease-out ${
          sheet === "confirm"
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        } border-t border-[var(--color-border)] bg-[var(--color-surface)]`}
      >
        <div className="flex flex-col gap-5 px-5 pt-6 pb-10">
          {/* Handle */}
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <TriangleAlert
                  size={18}
                  className="text-status-negative shrink-0"
                />
                <span className="text-status-negative text-[14px] font-semibold tracking-[1px]">
                  CẢNH BÁO
                </span>
              </div>
              <p className="text-foreground text-[16px] leading-snug font-bold">
                {displayName}, chọn dữ liệu muốn xóa
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-foreground-muted hover:text-foreground mt-0.5 shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Toggle all + count */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleAll}
              className="text-foreground-secondary hover:text-foreground flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.5px] transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={15} className="text-status-negative" />
              ) : (
                <Square size={15} />
              )}
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            {selectedCount > 0 && (
              <span className="text-status-negative text-[11px] font-semibold tracking-[0.5px]">
                {selectedCount}/{DATA_CATEGORIES.length} mục được chọn
              </span>
            )}
          </div>

          {/* Checkbox list */}
          <div className="flex flex-col gap-0 overflow-hidden border border-[var(--color-border)]">
            {DATA_CATEGORIES.map((cat, idx) => {
              const isChecked = selected.has(cat.key);
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleItem(cat.key)}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    idx < DATA_CATEGORIES.length - 1
                      ? "border-b border-[var(--color-border)]"
                      : ""
                  } ${isChecked ? "bg-status-negative/8" : "hover:bg-white/3"}`}
                >
                  {/* Custom checkbox */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                      isChecked
                        ? "border-status-negative bg-status-negative"
                        : "border-[var(--color-border-strong)] bg-transparent"
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
                      className={`text-[13px] font-semibold transition-colors ${
                        isChecked ? "text-status-negative" : "text-foreground"
                      }`}
                    >
                      {cat.label}
                    </span>
                    <span className="text-foreground-muted text-[11px]">
                      {cat.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Warning note */}
          <p className="text-status-negative text-[11px] font-semibold tracking-[0.5px]">
            Không thể hoàn tác sau khi xóa.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="border-border text-foreground h-12 flex-1 border text-[13px] font-bold tracking-[0.5px] transition-colors hover:bg-white/5"
            >
              HỦY
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedCount === 0}
              className={`h-12 flex-1 border text-[13px] font-bold tracking-[0.5px] transition-colors ${
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
      </div>

      {/* ── Sheet 2: Type RESET ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl transition-transform duration-300 ease-out ${
          sheet === "type"
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        } border-t border-[var(--color-border)] bg-[var(--color-surface)]`}
      >
        <div className="flex flex-col gap-6 px-5 pt-6 pb-10">
          {/* Handle */}
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-status-negative text-[13px] font-semibold tracking-[1.5px]">
                XÁC NHẬN LẦN CUỐI
              </span>
              <p className="text-foreground text-[15px] font-bold">
                Gõ{" "}
                <span className="text-status-negative">
                  &ldquo;RESET&rdquo;
                </span>{" "}
                để xác nhận xóa {selectedCount} mục
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-foreground-muted hover:text-foreground mt-0.5 shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Selected summary */}
          <div className="bg-status-negative/8 border-status-negative/20 flex flex-col gap-1.5 border p-3.5">
            <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1px]">
              SẼ XÓA:
            </span>
            {DATA_CATEGORIES.filter((c) => selected.has(c.key)).map((c) => (
              <span
                key={c.key}
                className="text-status-negative flex items-center gap-2 text-[12px] font-medium"
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
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[14px] font-bold tracking-[2px] outline-none placeholder:font-normal placeholder:tracking-normal"
            />
          </div>

          {/* Delete button */}
          <button
            id="confirm-reset-btn"
            type="button"
            disabled={!isUnlocked || isPending}
            onClick={handleReset}
            className={`h-14 w-full text-[13px] font-bold tracking-[1px] transition-all duration-200 ${
              isUnlocked && !isPending
                ? "bg-status-negative text-white opacity-100 active:scale-[0.98]"
                : "bg-status-negative/20 text-status-negative/40 cursor-not-allowed opacity-60"
            }`}
          >
            {isPending ? "ĐANG XÓA..." : `XÓA ${selectedCount} MỤC DỮ LIỆU`}
          </button>
        </div>
      </div>
    </>
  );
}
