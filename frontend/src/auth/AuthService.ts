import axios from 'axios';
import { TokenManager } from './TokenManager';

const BASE_URL = process.env.API_BASE_URL ?? '';

// Callback set by the app to navigate to login when session fully expires
let onSessionExpired: (() => void) | null = null;

export const AuthService = {
  setSessionExpiredCallback(cb: () => void) {
    onSessionExpired = cb;
  },

  async login(email: string, password: string): Promise<void> {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password,
    });
    const { accessToken, refreshToken } = response.data;
    await TokenManager.saveTokens(accessToken, refreshToken);
  },

  // Returns new access token or throws if refresh token is expired
  async refreshAccessToken(): Promise<string> {
    const refreshToken = await TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken,
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    // Rotation: save both new tokens
    await TokenManager.saveTokens(accessToken, newRefreshToken);
    return accessToken;
  },

  async logout(): Promise<void> {
    await TokenManager.clearTokens();
    onSessionExpired?.();
  },
};
