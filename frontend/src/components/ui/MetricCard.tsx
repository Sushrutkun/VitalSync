import type { ReactNode } from "react";
import Svg, { Polyline } from "react-native-svg";
import { Text, XStack, YStack } from "tamagui";

import { Body } from "./Heading";
import { Card } from "./Card";

type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: { value: string; positive: boolean };
  icon?: ReactNode;
  /** Accent token name OR raw color string for value. */
  accent?: string;
  large?: boolean;
  /** Optional pulse dot color (for "live" indication). */
  pulseColor?: string;
  /** Optional sparkline series (raw values; auto-normalized). */
  trend?: number[];
  /** Width override (default: flex). */
  minWidth?: number;
};

export function MetricCard({
  label,
  value,
  unit,
  delta,
  icon,
  accent,
  large,
  pulseColor,
  trend,
  minWidth,
}: Props) {
  return (
    <Card
      flex={large ? undefined : 1}
      minWidth={large ? undefined : minWidth ?? 140}
      padding={16}
      gap={8}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={6}>
          {pulseColor ? (
            <YStack
              width={6}
              height={6}
              borderRadius={3}
              backgroundColor={pulseColor as any}
            />
          ) : null}
          <Body tone="muted" eyebrow>
            {label}
          </Body>
        </XStack>
        {icon}
      </XStack>

      <XStack alignItems="baseline" gap={6}>
        <Text
          fontFamily="$heading"
          fontStyle="italic"
          fontWeight="400"
          fontSize={large ? 44 : 30}
          lineHeight={large ? 48 : 34}
          color={(accent ?? "$color") as any}
        >
          {value}
        </Text>
        {unit ? (
          <Body tone="muted" size="sm" letterSpacing={0.8}>
            {unit}
          </Body>
        ) : null}
      </XStack>

      {trend && trend.length > 1 ? <Sparkline values={trend} color={accent} /> : null}

      {delta ? (
        <Body size="xs" tone={delta.positive ? "accent" : "danger"} letterSpacing={0.8}>
          {delta.positive ? "▲" : "▼"} {delta.value}
        </Body>
      ) : null}
    </Card>
  );
}

function Sparkline({ values, color }: { values: number[]; color?: string }) {
  const w = 100;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Polyline
        points={pts}
        fill="none"
        stroke={color ?? "#7CF7B0"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
    </Svg>
  );
}
