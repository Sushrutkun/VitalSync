import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function fromExtra(key: string): string | null {
  const v = extra[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    fromExtra("API_BASE_URL") ??
    "http://localhost:8080",
};
