// src/services/ficeApi.ts
import type {
  FinancialProfileInput,
  FinancialIdentity,
  FinancialIdentitySnapshot,
} from "@/types/domain";

const FICE_BASE = import.meta.env.VITE_FICE_BASE_URL as string;

function getToken() {
  // Ajusta esto a como guardas el token en tu app
  // (en muchos setups es localStorage.getItem("token") o "devioz.auth.token")
  return localStorage.getItem("token") || "";
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!FICE_BASE) throw new Error("Falta VITE_FICE_BASE_URL");

  const token = getToken();

  const res = await fetch(`${FICE_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  // Si tu backend devuelve texto
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// 🔹 Inputs
export function getInputs(): Promise<FinancialProfileInput[]> {
  // Ajusta la ruta exacta a tu backend:
  // ejemplo: "/inputs" o "/fice/inputs" o "/api/inputs"
  return http<FinancialProfileInput[]>("/inputs");
}

export function addInput(payload: {
  input_type: string;
  input_value: string;
  reason?: string;
}): Promise<any> {
  // Ajusta la ruta exacta
  return http("/inputs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 🔹 Identity
export function getFinancialIdentity(): Promise<FinancialIdentity> {
  // Ajusta la ruta exacta
  return http<FinancialIdentity>("/identity");
}

// 🔹 Snapshots
export function getSnapshots(): Promise<FinancialIdentitySnapshot[]> {
  // Ajusta la ruta exacta
  return http<FinancialIdentitySnapshot[]>("/snapshots");
}