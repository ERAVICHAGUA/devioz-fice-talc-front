import { api } from "./http";
import type { Role } from "@/types/domain";

export type LoginRes = { token?: string; user_id?: string; role?: Role };

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginRes>("talc", "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    api<any>("talc", "/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // ✅ JWT logout real: borrar token local (no llamar al backend)
  logout: async () => {
    localStorage.removeItem("devioz.auth");
    return null;
  },
};