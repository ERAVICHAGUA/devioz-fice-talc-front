import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role } from "@/types/domain";
import { authApi } from "@/services/authApi";

type AuthState =
  | {
      status: "anonymous";
      token: null;
      user_id: null;
      role: null;
      email: null;
      full_name: null;
    }
  | {
      status: "authenticated";
      token: string;
      user_id: string;
      role: Role | "User";
      email: string;
      full_name: string | null;
    };

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const LS_KEY = "devioz.auth";

/* ---------- Estado anónimo ---------- */
function anonymousState(): AuthState {
  return {
    status: "anonymous",
    token: null,
    user_id: null,
    role: null,
    email: null,
    full_name: null,
  };
}

/* ---------- Leer localStorage ---------- */
function readLS(): AuthState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return anonymousState();

    const parsed = JSON.parse(raw) as {
      token?: string;
      user_id?: string;
      role?: Role | "User";
      email?: string;
      full_name?: string | null;
    };

    if (!parsed?.token) return anonymousState();

    return {
      status: "authenticated",
      token: parsed.token,
      user_id: parsed.user_id ?? "me",
      role: (parsed.role ?? "User") as Role | "User",
      email: parsed.email ?? "usuario@dineroh.pe",
      full_name: parsed.full_name ?? null,
    };
  } catch {
    return anonymousState();
  }
}

/* ---------- Provider ---------- */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(anonymousState());

  useEffect(() => {
    setState(readLS());
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,

      /* ---------- LOGIN ---------- */
      login: async (email, password) => {
        const data = await authApi.login(email, password);

        if (!data?.token) {
          throw new Error("Respuesta inválida del servidor (sin token).");
        }

        const next = {
          token: data.token,
          user_id: data.user_id ?? "me",
          role: (data.role ?? "User") as Role | "User",
          email,           // usamos el email que el usuario escribió
          full_name: null, // tu backend aún no manda nombre
        };

        localStorage.setItem(LS_KEY, JSON.stringify(next));
        setState({ status: "authenticated", ...next });
      },

      /* ---------- REGISTER ---------- */
      register: async (email, password) => {
        await authApi.register(email, password);
      },

      /* ---------- LOGOUT ---------- */
      logout: async () => {
        try {
          if (state.status === "authenticated") {
            await authApi.logout().catch(() => null);
          }
        } finally {
          localStorage.removeItem(LS_KEY);
          setState(anonymousState());
        }
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------- Hook ---------- */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}