export const brand = {
  accent: "#7CF7B0",
  recovery: "#7CF7B0",
  strain: "#FFB23F",
  sleep: "#7AB6FF",
  danger: "#FF5C72",
  success: "#7CF7B0",
  violet: "#9F7CFF",
  coral: "#FF5C72",
  mintGlow: "rgba(124,247,176,0.35)",
  violetGlow: "rgba(159,124,255,0.35)",

  light: {
    background: "#FAF7F2",
    backgroundDeep: "#EFE8DC",
    surface: "rgba(255,255,255,0.65)",
    surfaceElevated: "rgba(255,255,255,0.85)",
    text: "#0E0B1F",
    textSecondary: "#3F3A52",
    muted: "#7A7896",
    border: "rgba(14,11,31,0.10)",
    borderStrong: "rgba(14,11,31,0.20)",
    accent: "#3DA679",
    violet: "#6A4FBE",
  },

  dark: {
    background: "#0B1426",
    backgroundDeep: "#06091A",
    surface: "rgba(255,255,255,0.04)",
    surfaceElevated: "rgba(255,255,255,0.07)",
    text: "#F4F1FF",
    textSecondary: "#B8B5D1",
    muted: "#7A7896",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
  },
} as const;

export const gradients = {
  surface: ["#0B1426", "#1B0B2E"] as const,
  surfaceLight: ["#FAF7F2", "#F0E8D8"] as const,
  recovery: ["#7CF7B0", "#3DBEA8"] as const,
  violet: ["#9F7CFF", "#5E3FBE"] as const,
  strain: ["#FFB23F", "#E07A1F"] as const,
  sleep: ["#7AB6FF", "#4F7FE0"] as const,
  danger: ["#FF5C72", "#C73E54"] as const,
  aurora: ["#7CF7B0", "#9F7CFF"] as const,
};

export const fonts = {
  display: "InstrumentSerif_400Regular",
  displayItalic: "InstrumentSerif_400Regular_Italic",
  body: "Geist_400Regular",
  bodyMedium: "Geist_500Medium",
  bodySemibold: "Geist_600SemiBold",
  bodyBold: "Geist_700Bold",
} as const;

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "vs.themePreference";
