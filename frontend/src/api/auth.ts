import { request } from "../lib/api";
import type { LoginResponse, RefreshResponse } from "../types/api";

export const authApi = {
  signup(email: string, password: string, name: string): Promise<LoginResponse> {
    return request<LoginResponse>("/api/v1/auth/signup", {
      method: "POST",
      body: { email, password, name },
      auth: false,
    });
  },
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },
  refresh(refreshToken: string): Promise<RefreshResponse> {
    return request<RefreshResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
  },
  logout(refreshToken: string): Promise<void> {
    return request<void>("/api/v1/auth/logout", {
      method: "POST",
      body: { refreshToken },
    });
  },
};
