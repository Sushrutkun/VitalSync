export const brand = {
  accent: "#7CF7B0",
  recovery: "#7CF7B0",
  strain: "#FFB23F",
  sleep: "#7AB6FF",
  danger: "#FF5C72",
  success: "#7CF7B0",

  light: {
    background: "#F6F7F9",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    text: "#0B0B0F",
    textSecondary: "#3F4250",
    muted: "#7A8194",
    border: "#E4E6EB",
    borderStrong: "#CBD0DA",
  },

  dark: {
    background: "#0B0B0F",
    surface: "#15161C",
    surfaceElevated: "#1E2029",
    text: "#F2F4F8",
    textSecondary: "#C5C9D4",
    muted: "#7A8194",
    border: "#262834",
    borderStrong: "#3A3D4D",
  },
} as const;

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "vs.themePreference";
