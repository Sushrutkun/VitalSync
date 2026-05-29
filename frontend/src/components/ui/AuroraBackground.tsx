import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { useTheme } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";

import { brand, gradients } from "@/src/theme/tokens";

type Props = {
  /** When true, orbs are larger and more saturated (for auth / hero screens). */
  intense?: boolean;
};

/**
 * Full-screen aurora ambient background.
 * Layers (bottom -> top):
 *  1. Vertical linear gradient (deep navy -> deep violet) for dark theme.
 *  2. Two SVG radial orbs (mint top-left, violet bottom-right) with slow opacity wobble.
 *  3. Hairline noise via translucent overlay (cheap grain effect).
 */
export function AuroraBackground({ intense = false }: Props) {
  const theme = useTheme();
  const bg = theme.background?.val ?? "#0B1426";
  const deep = theme.backgroundDeep?.val ?? "#06091A";

  const isLight = bg === brand.light.background;

  const stops = isLight ? gradients.surfaceLight : (gradients.surface as readonly [string, string]);

  const mint = useSharedValue(0.85);
  const violet = useSharedValue(0.85);

  useEffect(() => {
    mint.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    violet.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [mint, violet]);

  const mintStyle = useAnimatedStyle(() => ({ opacity: mint.value }));
  const violetStyle = useAnimatedStyle(() => ({ opacity: violet.value }));

  const mintColor = isLight ? "rgba(61,166,121,0.35)" : brand.mintGlow;
  const violetColor = isLight ? "rgba(106,79,190,0.30)" : brand.violetGlow;

  const orbSize = intense ? 520 : 420;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[stops[0], stops[1], deep]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            top: -orbSize * 0.35,
            left: -orbSize * 0.3,
            width: orbSize,
            height: orbSize,
          },
          mintStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="mintOrb" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={mintColor} stopOpacity={1} />
              <Stop offset="60%" stopColor={mintColor} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={mintColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="50" rx="50" ry="50" fill="url(#mintOrb)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -orbSize * 0.3,
            right: -orbSize * 0.3,
            width: orbSize,
            height: orbSize,
          },
          violetStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="violetOrb" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={violetColor} stopOpacity={1} />
              <Stop offset="60%" stopColor={violetColor} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={violetColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="50" rx="50" ry="50" fill="url(#violetOrb)" />
        </Svg>
      </Animated.View>

      {!isLight ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(255,255,255,0.015)" },
          ]}
        />
      ) : null}
    </View>
  );
}
