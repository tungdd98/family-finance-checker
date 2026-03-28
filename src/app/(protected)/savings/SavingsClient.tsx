"use client";

import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";

import type { SavingsAccount } from "@/lib/services/savings";
import { formatVND } from "@/lib/gold-utils";
import { SavingsCard } from "./components/SavingsCard";
import { AddEditSavingsSheet } from "./components/AddEditSavingsSheet";
import { DeleteSavingsDialog } from "./components/DeleteSavingsDialog";
import { SavingsActionSheet } from "./components/SavingsActionSheet";

interface Props {
  initialAccounts: SavingsAccount[];
}

export function SavingsClient({ initialAccounts }: Props) {
  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "delete" | "action" | null
  >(null);
  const [selected, setSelected] = useState<SavingsAccount | null>(null);

  const totalPrincipal = initialAccounts.reduce((s, a) => s + a.principal, 0);

  const openAction = (account: SavingsAccount) => {
    setSelected(account);
    setActiveSheet("action");
  };

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          TIẾT KIỆM
        </h1>
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
        <div className="bg-surface flex flex-col gap-1 p-4">
          <p className="text-foreground-muted text-[11px] font-semibold tracking-[1.5px]">
            TỔNG TIẾT KIỆM GỐC
          </p>
          <p className="text-foreground text-[28px] font-bold tracking-[-1px]">
            {totalPrincipal > 0 ? formatVND(totalPrincipal) : "—"}
          </p>
          <p className="text-foreground-secondary text-[12px]">
            {initialAccounts.length} khoản tiết kiệm đang được quản lý
          </p>
        </div>
      )}

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
        <div className="flex flex-col gap-3 pb-24">
          {initialAccounts.map((account) => (
            <SavingsCard
              key={account.id}
              account={account}
              onTap={openAction}
            />
          ))}
        </div>
      )}

      {/* Action Sheet */}
      <SavingsActionSheet
        account={selected}
        open={activeSheet === "action"}
        onOpenChange={(o) => {
          if (!o) setActiveSheet(null);
        }}
        onEdit={() => setActiveSheet("edit")}
        onDelete={() => setActiveSheet("delete")}
      />

      {/* Add/Edit Drawer */}
      <AddEditSavingsSheet
        mode={activeSheet === "edit" ? "edit" : "add"}
        account={selected || undefined}
        open={activeSheet === "add" || activeSheet === "edit"}
        onOpenChange={(o) => {
          if (!o) setActiveSheet(null);
        }}
      />

      {/* Delete Dialog */}
      <DeleteSavingsDialog
        account={selected}
        open={activeSheet === "delete"}
        onOpenChange={(o) => {
          if (!o) setActiveSheet(null);
        }}
      />
    </div>
  );
}
