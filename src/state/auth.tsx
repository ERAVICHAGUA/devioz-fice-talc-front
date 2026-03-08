import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type RegisterPayload } from "@/services/authApi";
import type { Role } from "@/types/domain";

type AuthState =
  | {
      status: "anonymous";
      token: null;
      userId: null;
      user_id: null;
      email: null;
      firstName: null;
      lastName: null;
      username: null;
      full_name: null;
      role: null;
    }
  | {
      status: "authenticated";
      token: string;
      userId: string;
      user_id: string;
      email: string;
      firstName: string;
      lastName: string;
      username: string;
      full_name: string | null;
      role: Role | "User";
    };

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const LS_KEY = "devioz.auth";

function anonymousState(): AuthState {
  return {
    status: "anonymous",
    token: null,
    userId: null,
    user_id: null,
    email: null,
    firstName: null,
    lastName: null,
    username: null,
    full_name: null,
    role: null,
  };
}

function buildFullName(firstName?: string | null, lastName?: string | null) {
  const value = [firstName ?? "", lastName ?? ""].join(" ").trim();
  return value || null;
}

function readLS(): AuthState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return anonymousState();

    const parsed = JSON.parse(raw) as {
      token?: string;
      userId?: string | number;
      user_id?: string | number;
      email?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      full_name?: string | null;
      role?: Role | "User";
    };

    const resolvedUserId =
      parsed.userId != null
        ? String(parsed.userId)
        : parsed.user_id != null
        ? String(parsed.user_id)
        : null;

    if (!parsed?.token || !resolvedUserId) return anonymousState();

    const firstName = parsed.firstName ?? "";
    const lastName = parsed.lastName ?? "";
    const fullName = parsed.full_name ?? buildFullName(firstName, lastName);

    return {
      status: "authenticated",
      token: parsed.token,
      userId: resolvedUserId,
      user_id: resolvedUserId,
      email: parsed.email ?? "",
      firstName,
      lastName,
      username: parsed.username ?? "",
      full_name: fullName,
      role: (parsed.role ?? "User") as Role | "User",
    };
  } catch {
    return anonymousState();
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(anonymousState());

  useEffect(() => {
    setState(readLS());
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,

      login: async (email, password) => {
        const data = await authApi.login(email, password);

        if (!data?.token) {
          throw new Error("Respuesta inválida del servidor (sin token).");
        }

        const firstName = data.firstName ?? "";
        const lastName = data.lastName ?? "";
        const resolvedUserId = String(data.userId);
        const fullName = buildFullName(firstName, lastName);

        const next = {
          token: data.token,
          userId: resolvedUserId,
          user_id: resolvedUserId,
          email: data.email ?? email,
          firstName,
          lastName,
          username: data.username ?? "",
          full_name: fullName,
          role: "User" as Role | "User",
        };

        localStorage.setItem(LS_KEY, JSON.stringify(next));
        setState({ status: "authenticated", ...next });
      },

      register: async (payload) => {
        await authApi.register(payload);
      },

      logout: async () => {
        localStorage.removeItem(LS_KEY);
        setState(anonymousState());
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}