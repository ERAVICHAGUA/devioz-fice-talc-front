import { api } from "./http";

export interface FinancialIdentity {
  id: number;
  userId: number;
  incomeType: string;
  incomeStabilityScore: number;
  riskTolerance: string;
  decisionStyle: string;
  createdAt: string;
  lastUpdated: string;
}

export interface CreateFinancialIdentityRequest {
  userId: number;
  incomeType: string;
  incomeStabilityScore: number;
  riskTolerance: string;
  decisionStyle: string;
}

export interface UpdateFinancialIdentityRequest {
  incomeType: string;
  incomeStabilityScore: number;
  riskTolerance: string;
  decisionStyle: string;
}

export interface FinancialIdentitySnapshot {
  id: number;
  financialIdentityId: number;
  changeReason: string;
  createdAt: string;
}

export const ficeApi = {
  createFinancialIdentity(payload: CreateFinancialIdentityRequest) {
    return api<FinancialIdentity>("fice", "/financial-identity", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getFinancialIdentityByUserId(userId: number) {
    return api<FinancialIdentity>("fice", `/financial-identity/${userId}`);
  },

  updateFinancialIdentity(userId: number, payload: UpdateFinancialIdentityRequest) {
    return api<FinancialIdentity>("fice", `/financial-identity/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getSnapshotsByFinancialIdentityId(financialIdentityId: number) {
    return api<FinancialIdentitySnapshot[]>(
      "fice",
      `/financial-identity-snapshots/${financialIdentityId}`
    );
  },
};