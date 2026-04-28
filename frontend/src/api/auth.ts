import { request } from "../lib/api";
import type { LoginResponse, RefreshResponse } from "../types/api";

export const authApi = {
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },
  refresh(refreshToken: string): Promise<RefreshResponse> {
    return request<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
  },
  logout(refreshToken: string): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST",
      body: { refreshToken },
    });
  },
};
