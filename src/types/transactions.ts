// src/types/transactions.ts
export type TxKind =
  | "income"
  | "expense"
  | "gold_buy"
  | "gold_sell"
  | "savings";

export interface RecentTx {
  kind: TxKind;
  label: string;
  amount: number;
  date: string;
  note?: string | null;
}
