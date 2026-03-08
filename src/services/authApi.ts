const BASE_URL = import.meta.env.VITE_TALC_BASE_URL;

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  username: string;
  age?: number;
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Credenciales inválidas");
    }

    return res.json();
  },

  async register(data: RegisterPayload) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Error al registrar");
    }

    return res.json();
  },

  async logout() {
    return Promise.resolve();
  },
};