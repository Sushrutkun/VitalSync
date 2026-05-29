import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";

import { Body } from "./Heading";
import { Card } from "./Card";

type Props = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  /** Tint color for the leading icon halo background. */
  leadingTint?: string;
  onPress?: () => void;
};

export function RowItem({ title, subtitle, trailing, leading, leadingTint, onPress }: Props) {
  return (
    <Card
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={14}
      gap={12}
      interactive={Boolean(onPress)}
      onPress={onPress}
    >
      <XStack flex={1} alignItems="center" gap={12}>
        {leading ? (
          <YStack
            width={36}
            height={36}
            borderRadius={18}
            alignItems="center"
            justifyContent="center"
            backgroundColor={(leadingTint ? withAlpha(leadingTint, 0.18) : "rgba(255,255,255,0.06)") as any}
            borderWidth={1}
            borderColor={(leadingTint ? withAlpha(leadingTint, 0.35) : "$borderColor") as any}
          >
            {leading}
          </YStack>
        ) : null}
        <YStack flex={1}>
          <Body weight="semibold">{title}</Body>
          {subtitle ? (
            <Body tone="muted" size="sm">
              {subtitle}
            </Body>
          ) : null}
        </YStack>
      </XStack>
      {trailing}
    </Card>
  );
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("rgba")) return color;
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
