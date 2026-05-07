import { useEffect } from "react";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { YStack } from "tamagui";

import { Body } from "./Heading";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  label: string;
  value: string;
  unit?: string;
};

export function Ring({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor = "rgba(255,255,255,0.08)",
  label,
  value,
  unit,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [p, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - p.value),
  }));

  return (
    <YStack alignItems="center" justifyContent="center" width={size} height={size} position="relative">
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={animatedProps}
        />
      </Svg>
      <YStack position="absolute" alignItems="center" justifyContent="center">
        <Body size="xs" tone="muted" weight="semibold">
          {label.toUpperCase()}
        </Body>
        <Body fontSize={Math.round(size * 0.22)} weight="bold" color={color as any}>
          {value}
        </Body>
        {unit ? (
          <Body size="xs" tone="muted">
            {unit}
          </Body>
        ) : null}
      </YStack>
    </YStack>
  );
}
