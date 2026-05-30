import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEYS = {
  accessToken: "vs.accessToken",
  refreshToken: "vs.refreshToken",
  userId: "vs.userId",
  lastSnapshotTimestamp: "vs.lastSnapshotTimestamp",
} as const;

const isWeb = Platform.OS === "web";

export const store = {
  async get(key: string): Promise<string | null> {
    if (isWeb) return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (isWeb) { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return store.get(KEYS.accessToken);
  },
  async getRefreshToken(): Promise<string | null> {
    return store.get(KEYS.refreshToken);
  },
  async getUserId(): Promise<string | null> {
    return store.get(KEYS.userId);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      store.set(KEYS.accessToken, accessToken),
      store.set(KEYS.refreshToken, refreshToken),
    ]);
  },
  async setUserId(userId: string): Promise<void> {
    await store.set(KEYS.userId, userId);
  },
  async clear(): Promise<void> {
    await Promise.all([
      store.delete(KEYS.accessToken),
      store.delete(KEYS.refreshToken),
      store.delete(KEYS.userId),
      store.delete(KEYS.lastSnapshotTimestamp),
    ]);
  },
};

export const checkpointStorage = {
  async getLastSnapshotTimestamp(): Promise<string | null> {
    return store.get(KEYS.lastSnapshotTimestamp);
  },
  async setLastSnapshotTimestamp(isoString: string): Promise<void> {
    await store.set(KEYS.lastSnapshotTimestamp, isoString);
  },
  async clear(): Promise<void> {
    await store.delete(KEYS.lastSnapshotTimestamp);
  },
};
