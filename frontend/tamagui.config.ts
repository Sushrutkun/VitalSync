import { animations as v5Animations } from "@tamagui/config/v5-rn";
import {
  media,
  settings,
  shorthands,
  themes as v5Themes,
  tokens as v5Tokens,
} from "@tamagui/config/v5";
import { createFont, createTamagui } from "tamagui";

import { brand } from "./src/theme/tokens";

const bodyFont = createFont({
  family: "Geist_400Regular",
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
    9: 24,
    10: 28,
    true: 14,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 18,
    4: 20,
    5: 22,
    6: 24,
    7: 26,
    8: 28,
    9: 32,
    10: 36,
    true: 20,
  },
  weight: {
    1: "400",
    2: "500",
    3: "600",
    4: "700",
    true: "400",
  },
  letterSpacing: {
    1: 0,
    2: 0.2,
    3: 0.4,
    4: 0.6,
    true: 0,
  },
  face: {
    400: { normal: "Geist_400Regular" },
    500: { normal: "Geist_500Medium" },
    600: { normal: "Geist_600SemiBold" },
    700: { normal: "Geist_700Bold" },
  },
});

const headingFont = createFont({
  family: "InstrumentSerif_400Regular",
  size: {
    1: 16,
    2: 20,
    3: 24,
    4: 30,
    5: 36,
    6: 44,
    7: 52,
    8: 60,
    9: 72,
    10: 84,
    true: 30,
  },
  lineHeight: {
    1: 20,
    2: 24,
    3: 28,
    4: 34,
    5: 40,
    6: 48,
    7: 56,
    8: 64,
    9: 76,
    10: 88,
    true: 34,
  },
  weight: {
    1: "400",
    true: "400",
  },
  letterSpacing: {
    1: -0.2,
    2: -0.4,
    3: -0.6,
    4: -0.8,
    true: -0.4,
  },
  face: {
    400: {
      normal: "InstrumentSerif_400Regular",
      italic: "InstrumentSerif_400Regular_Italic",
    },
  },
});

const lightOverrides = {
  background: brand.light.background,
  backgroundHover: brand.light.surface,
  backgroundPress: brand.light.surface,
  backgroundFocus: brand.light.surface,
  backgroundDeep: brand.light.backgroundDeep,
  color: brand.light.text,
  colorHover: brand.light.text,
  colorPress: brand.light.text,
  colorFocus: brand.light.text,
  colorSecondary: brand.light.textSecondary,
  borderColor: brand.light.border,
  borderColorHover: brand.light.borderStrong,
  borderColorStrong: brand.light.borderStrong,
  placeholderColor: brand.light.muted,
  card: "transparent",
  cardElevated: brand.light.surfaceElevated,
  surface: brand.light.surface,
  surfaceElevated: brand.light.surfaceElevated,
  muted: brand.light.muted,
  accent: brand.light.accent,
  recovery: brand.recovery,
  strain: brand.strain,
  sleep: brand.sleep,
  danger: brand.danger,
  success: brand.success,
  violet: brand.light.violet,
  coral: brand.coral,
};

const darkOverrides = {
  background: brand.dark.background,
  backgroundHover: brand.dark.surface,
  backgroundPress: brand.dark.surface,
  backgroundFocus: brand.dark.surface,
  backgroundDeep: brand.dark.backgroundDeep,
  color: brand.dark.text,
  colorHover: brand.dark.text,
  colorPress: brand.dark.text,
  colorFocus: brand.dark.text,
  colorSecondary: brand.dark.textSecondary,
  borderColor: brand.dark.border,
  borderColorHover: brand.dark.borderStrong,
  borderColorStrong: brand.dark.borderStrong,
  placeholderColor: brand.dark.muted,
  card: "transparent",
  cardElevated: brand.dark.surfaceElevated,
  surface: brand.dark.surface,
  surfaceElevated: brand.dark.surfaceElevated,
  muted: brand.dark.muted,
  accent: brand.accent,
  recovery: brand.recovery,
  strain: brand.strain,
  sleep: brand.sleep,
  danger: brand.danger,
  success: brand.success,
  violet: brand.violet,
  coral: brand.coral,
};

const tamaguiConfig = createTamagui({
  animations: v5Animations,
  defaultFont: "body",
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  shorthands,
  media,
  settings: {
    ...settings,
    onlyAllowShorthands: false,
  },
  tokens: v5Tokens,
  themes: {
    ...v5Themes,
    light: { ...v5Themes.light, ...lightOverrides },
    dark: { ...v5Themes.dark, ...darkOverrides },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
