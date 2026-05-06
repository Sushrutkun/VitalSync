import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";

import { Body } from "./Heading";
import { Card } from "./Card";

type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: { value: string; positive: boolean };
  icon?: ReactNode;
  accent?: string;
  large?: boolean;
};

export function MetricCard({ label, value, unit, delta, icon, accent, large }: Props) {
  return (
    <Card flex={large ? undefined : 1} minWidth={large ? undefined : 140} padding={16} gap={6}>
      <XStack alignItems="center" justifyContent="space-between">
        <Body tone="muted" size="sm" weight="semibold">
          {label.toUpperCase()}
        </Body>
        {icon}
      </XStack>
      <YStack>
        <XStack alignItems="baseline" gap={4}>
          <Body size="lg" weight="bold" fontSize={large ? 32 : 24} color={accent ?? ("$color" as any)}>
            {value}
          </Body>
          {unit ? (
            <Body tone="muted" size="sm">
              {unit}
            </Body>
          ) : null}
        </XStack>
        {delta ? (
          <Body size="xs" color={delta.positive ? "$success" : "$danger"}>
            {delta.positive ? "▲" : "▼"} {delta.value}
          </Body>
        ) : null}
      </YStack>
    </Card>
  );
}
