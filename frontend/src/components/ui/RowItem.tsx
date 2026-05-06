import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";

import { Body } from "./Heading";
import { Card } from "./Card";

type Props = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  onPress?: () => void;
};

export function RowItem({ title, subtitle, trailing, leading, onPress }: Props) {
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
        {leading}
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
