import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { YStack, type YStackProps } from "tamagui";

import { brand } from "@/src/theme/tokens";

type Props = YStackProps & {
  children?: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  glow?: "mint" | "violet" | "strain" | "sleep" | "danger" | false;
  /** Disable BlurView wrapper (for nested glass or perf-sensitive areas). */
  flat?: boolean;
};

const GLOW_COLOR: Record<string, string> = {
  mint: brand.accent,
  violet: brand.violet,
  strain: brand.strain,
  sleep: brand.sleep,
  danger: brand.danger,
};

export function Card({
  children,
  elevated,
  interactive,
  glow = false,
  flat = false,
  ...rest
}: Props) {
  const radius = 20;
  const inner = (
    <YStack
      borderRadius={radius}
      padding={16}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor={elevated ? "$surfaceElevated" : "$surface"}
      gap={8}
      pressStyle={interactive ? { scale: 0.98, opacity: 0.9 } : undefined}
      overflow="hidden"
      {...rest}
    >
      {children}
    </YStack>
  );

  // Web BlurView is limited — skip wrapper and rely on translucent surface.
  if (flat || Platform.OS === "web") {
    if (glow) {
      return (
        <View style={glowStyle(glow, radius)}>
          {inner}
        </View>
      );
    }
    return inner;
  }

  const blurContent = (
    <BlurView
      intensity={28}
      tint="dark"
      style={{ borderRadius: radius, overflow: "hidden" }}
    >
      {inner}
    </BlurView>
  );

  if (glow) {
    return <View style={glowStyle(glow, radius)}>{blurContent}</View>;
  }
  return blurContent;
}

function glowStyle(glow: Exclude<Props["glow"], false | undefined>, radius: number) {
  const color = GLOW_COLOR[glow];
  return StyleSheet.flatten({
    borderRadius: radius,
    shadowColor: color,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  });
}
