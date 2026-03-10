import { api } from "./http";

export interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  currency: string;
  rawDescription: string;
  merchantRaw: string;
  occurredAt: string;
  category?: string;
}

export const tiieApi = {
  getTransactions(userId: number) {
    return api<Transaction[]>("tiie", `/api/transactions?userId=${userId}`);
  },

  createTransaction(payload: any) {
    return api<Transaction>("tiie", "/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};