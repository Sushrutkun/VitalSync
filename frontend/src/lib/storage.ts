import * as SecureStore from "expo-secure-store";

const KEYS = {
  accessToken: "vs.accessToken",
  refreshToken: "vs.refreshToken",
  userId: "vs.userId",
} as const;

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.accessToken);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.refreshToken);
  },
  async getUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.userId);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    ]);
  },
  async setUserId(userId: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.userId, userId);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
      SecureStore.deleteItemAsync(KEYS.userId),
    ]);
  },
};
