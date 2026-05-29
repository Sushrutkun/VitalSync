import { StyleSheet, View } from "react-native";

import { useThemePref } from "@/src/theme/ThemeProvider";
import { brand } from "@/src/theme/tokens";

type Props = {
  intense?: boolean;
  isLight?: boolean;
};

export function AuroraBackground({ isLight: isLightProp }: Props) {
  const { resolved } = useThemePref();
  const isLight = isLightProp !== undefined ? isLightProp : resolved === "light";
  const base = isLight ? brand.light.background : brand.dark.background;
  const deep = isLight ? brand.light.backgroundDeep : brand.dark.backgroundDeep;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: deep, opacity: 0.35 }]} />
    </View>
  );
}
