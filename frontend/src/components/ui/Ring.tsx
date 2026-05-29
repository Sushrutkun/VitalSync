import { useEffect } from "react";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { Text, YStack } from "tamagui";

import { Body } from "./Heading";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  /** Optional gradient end stop (defaults to slightly lighter tint). */
  colorEnd?: string;
  trackColor?: string;
  label: string;
  value: string;
  unit?: string;
  /** Stagger delay in ms for entering animation. */
  delay?: number;
  /** Hide center label (useful when caller renders custom center content). */
  hideCenter?: boolean;
};

function lighten(hex: string, amount = 0.25): string {
  // Simple lighten: blend with white. Assumes #RRGGBB.
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `rgb(${lr},${lg},${lb})`;
}

export function Ring({
  progress,
  size = 140,
  strokeWidth = 10,
  color,
  colorEnd,
  trackColor = "rgba(255,255,255,0.06)",
  label,
  value,
  unit,
  delay = 0,
  hideCenter = false,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  const gradId = `ringGrad-${Math.round(size)}-${color.replace(/[^a-z0-9]/gi, "")}`;
  const endColor = colorEnd ?? lighten(color, 0.35);

  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [p, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - p.value),
  }));

  // Halo: same arc, larger stroke, low opacity — fake glow.
  const haloAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - p.value),
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(delay)}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="100%" stopColor={endColor} stopOpacity={1} />
          </SvgLinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Halo (glow) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth + 8}
          strokeOpacity={0.18}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={haloAnimatedProps}
        />

        {/* Main progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={animatedProps}
        />
      </Svg>

      {!hideCenter ? (
        <YStack position="absolute" alignItems="center" justifyContent="center">
          <Body
            tone="muted"
            weight="medium"
            fontSize={10}
            letterSpacing={2}
          >
            {label.toUpperCase()}
          </Body>
          <Text
            fontFamily="$heading"
            fontStyle="italic"
            color={color as any}
            fontSize={Math.round(size * 0.34)}
            lineHeight={Math.round(size * 0.36)}
          >
            {value}
          </Text>
          {unit ? (
            <Body tone="muted" size="xs" letterSpacing={1.2}>
              {unit.toUpperCase()}
            </Body>
          ) : null}
        </YStack>
      ) : null}
    </Animated.View>
  );
}
