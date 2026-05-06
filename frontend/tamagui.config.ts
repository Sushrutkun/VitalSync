import { animations as v5Animations } from "@tamagui/config/v5-rn";
import {
  fonts,
  media,
  settings,
  shorthands,
  themes as v5Themes,
  tokens as v5Tokens,
} from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

import { brand } from "./src/theme/tokens";

const lightOverrides = {
  background: brand.light.background,
  backgroundHover: brand.light.surface,
  backgroundPress: brand.light.surface,
  backgroundFocus: brand.light.surface,
  color: brand.light.text,
  colorHover: brand.light.text,
  colorPress: brand.light.text,
  colorFocus: brand.light.text,
  borderColor: brand.light.border,
  borderColorHover: brand.light.borderStrong,
  placeholderColor: brand.light.muted,
  card: brand.light.surface,
  cardElevated: brand.light.surfaceElevated,
  muted: brand.light.muted,
  accent: brand.accent,
  recovery: brand.recovery,
  strain: brand.strain,
  sleep: brand.sleep,
  danger: brand.danger,
  success: brand.success,
};

const darkOverrides = {
  background: brand.dark.background,
  backgroundHover: brand.dark.surface,
  backgroundPress: brand.dark.surface,
  backgroundFocus: brand.dark.surface,
  color: brand.dark.text,
  colorHover: brand.dark.text,
  colorPress: brand.dark.text,
  colorFocus: brand.dark.text,
  borderColor: brand.dark.border,
  borderColorHover: brand.dark.borderStrong,
  placeholderColor: brand.dark.muted,
  card: brand.dark.surface,
  cardElevated: brand.dark.surfaceElevated,
  muted: brand.dark.muted,
  accent: brand.accent,
  recovery: brand.recovery,
  strain: brand.strain,
  sleep: brand.sleep,
  danger: brand.danger,
  success: brand.success,
};

const tamaguiConfig = createTamagui({
  animations: v5Animations,
  defaultFont: "body",
  fonts,
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
