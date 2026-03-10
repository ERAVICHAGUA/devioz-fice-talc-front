import { api } from "./http";

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
  login(email: string, password: string) {
    return api<LoginResponse>("talc", "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(data: RegisterPayload) {
    return api<LoginResponse>("talc", "/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout() {
    return Promise.resolve();
  },
};