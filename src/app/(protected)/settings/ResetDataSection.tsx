// src/app/(protected)/settings/ResetDataSection.tsx
"use client";

import { useState, useTransition } from "react";
import { Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { resetAllDataAction } from "@/app/actions/settings";

interface Props {
  displayName: string;
}

export function ResetDataSection({ displayName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Sheet state: "closed" | "confirm" | "type"
  const [sheet, setSheet] = useState<"closed" | "confirm" | "type">("closed");
  const [typed, setTyped] = useState("");

  const KEYWORD = "RESET";
  const isUnlocked = typed.trim().toUpperCase() === KEYWORD;

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetAllDataAction();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa toàn bộ dữ liệu");
        setSheet("closed");
        setTyped("");
        router.refresh();
      }
    });
  };

  const handleClose = () => {
    setSheet("closed");
    setTyped("");
  };

  return (
    <>
      {/* Trigger button */}
      <button
        id="reset-data-btn"
        type="button"
        onClick={() => setSheet("confirm")}
        className="border-status-negative/20 text-status-negative hover:bg-status-negative/10 flex h-14 w-full items-center justify-center gap-2 border text-[13px] font-bold tracking-[1px] transition-colors"
      >
        <Trash2 size={16} />
        XÓA TOÀN BỘ DỮ LIỆU
      </button>

      {/* Overlay */}
      {sheet !== "closed" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Sheet – Step 1: Confirm */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl transition-transform duration-300 ease-out ${
          sheet === "confirm"
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        } border-t border-[var(--color-border)] bg-[var(--color-surface)]`}
      >
        <div className="flex flex-col gap-6 px-5 pt-6 pb-10">
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
                {displayName}, bạn có chắc muốn xóa toàn bộ dữ liệu?
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

          {/* Description */}
          <div className="bg-status-negative/8 border-status-negative/20 flex flex-col gap-2 border p-4">
            <p className="text-foreground-secondary text-[12px] leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn:
            </p>
            <ul className="flex flex-col gap-1">
              {[
                "Tất cả tài khoản tiết kiệm",
                "Tất cả tài sản vàng",
                "Mục tiêu tài chính",
                "Dữ liệu thu chi hàng tháng",
                "Cài đặt tài khoản",
              ].map((item) => (
                <li
                  key={item}
                  className="text-foreground-secondary flex items-center gap-2 text-[12px]"
                >
                  <span className="bg-status-negative/50 h-1 w-1 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-status-negative mt-1 text-[11px] font-semibold tracking-[0.5px]">
              Không thể hoàn tác sau khi xóa.
            </p>
          </div>

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
              onClick={() => setSheet("type")}
              className="border-status-negative/30 bg-status-negative/10 text-status-negative hover:bg-status-negative/20 h-12 flex-1 border text-[13px] font-bold tracking-[0.5px] transition-colors"
            >
              TIẾP TỤC XÓA →
            </button>
          </div>
        </div>
      </div>

      {/* Sheet – Step 2: Type RESET */}
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
                để xác nhận xóa
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
            {isPending ? "ĐANG XÓA..." : "XÓA TOÀN BỘ DỮ LIỆU"}
          </button>
        </div>
      </div>
    </>
  );
}
