"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, PiggyBank, ChevronLeft } from "lucide-react";
import Link from "next/link";

import type { SavingsAccount } from "@/lib/services/savings";
import { formatVND } from "@/lib/gold-utils";
import { deleteSavingsAction } from "@/app/actions/savings";
import { SavingsCard } from "./components/SavingsCard";
import { AddEditSavingsSheet } from "./components/AddEditSavingsSheet";
import { DeleteConfirmDialog } from "@/components/common";
import { SavingsActionSheet } from "./components/SavingsActionSheet";

interface Props {
  initialAccounts: SavingsAccount[];
}

export function SavingsClient({ initialAccounts }: Props) {
  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "delete" | "action" | null
  >(null);
  const [selected, setSelected] = useState<SavingsAccount | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  const totalPrincipal = initialAccounts.reduce((s, a) => s + a.principal, 0);

  const openAction = (account: SavingsAccount) => {
    setSelected(account);
    setActiveSheet("action");
  };

  const handleDeleteConfirm = () => {
    if (!selected) return;
    startDeleteTransition(async () => {
      const result = await deleteSavingsAction(selected.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa khoản tiết kiệm");
        router.refresh();
        setActiveSheet(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Sticky Header Section */}
      <div className="bg-background sticky top-0 z-20 -mx-5 px-5 pt-5 pb-4 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/assets"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="type-featured-stat uppercase">TIẾT KIỆM</h1>
          </div>
          <button
            onClick={() => setActiveSheet("add")}
            className="bg-accent text-background flex h-11 w-11 shrink-0 items-center justify-center"
            aria-label="Thêm tiết kiệm"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Summary */}
        {initialAccounts.length > 0 && (
          <div className="bg-surface mt-4 flex flex-col gap-1 p-4">
            <p className="type-section-label">TỔNG TIẾT KIỆM GỐC</p>
            <p className="text-foreground text-[28px] font-bold tracking-[-1px]">
              {totalPrincipal > 0 ? formatVND(totalPrincipal) : "—"}
            </p>
            <p className="text-foreground-secondary text-[12px]">
              {initialAccounts.length} khoản tiết kiệm đang được quản lý
            </p>
          </div>
        )}
      </div>

      {/* List */}
      {initialAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <PiggyBank size={32} className="text-foreground-muted" />
          <div className="text-center">
            <p className="text-foreground text-[15px] font-bold">
              Chưa có khoản tiết kiệm nào
            </p>
            <p className="text-foreground-muted mt-1 text-[13px]">
              Nhấn nút + để thêm khoản tiết kiệm đầu tiên
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {initialAccounts.map((account) => (
            <SavingsCard
              key={account.id}
              account={account}
              onTap={openAction}
            />
          ))}
        </div>
      )}

      <SavingsActionSheet
        account={selected}
        open={activeSheet === "action"}
        onOpenChange={(o) => {
          if (!o) setActiveSheet(null);
        }}
        onEdit={() => setActiveSheet("edit")}
        onDelete={() => setActiveSheet("delete")}
      />

      <AddEditSavingsSheet
        key={selected?.id ?? "add"}
        mode={activeSheet === "edit" ? "edit" : "add"}
        account={selected || undefined}
        open={activeSheet === "add" || activeSheet === "edit"}
        onOpenChange={(o) => {
          if (!o) setActiveSheet(null);
        }}
      />

      <DeleteConfirmDialog
        open={activeSheet === "delete"}
        onOpenChange={(o) => {
          if (!o) setActiveSheet(null);
        }}
        title="Xóa khoản tiết kiệm"
        description={
          selected ? (
            <>
              Bạn có chắc muốn xóa khoản tiết kiệm{" "}
              <span className="text-foreground font-semibold">
                {selected.account_name || selected.bank_name}
              </span>{" "}
              — gốc {formatVND(selected.principal)}?
            </>
          ) : (
            ""
          )
        }
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </div>
  );
}
