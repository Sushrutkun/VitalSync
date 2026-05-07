import type { ReactNode } from "react";
import { ScrollView, type ScrollViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useTheme, YStack, type YStackProps } from "tamagui";

type Props = YStackProps & {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  edges?: Edge[];
  contentPadding?: number;
};

export function Screen({
  children,
  scroll = false,
  refreshControl,
  edges = ["top", "bottom"],
  contentPadding = 20,
  ...rest
}: Props) {
  const theme = useTheme();
  const bg = theme.background?.val ?? "#000";

  const inner = (
    <YStack flex={1} padding={contentPadding} gap="$3" {...rest}>
      {children}
    </YStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
