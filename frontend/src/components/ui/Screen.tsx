import type { ReactNode } from "react";
import { ScrollView, type ScrollViewProps, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { YStack, type YStackProps } from "tamagui";

type Props = YStackProps & {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  edges?: Edge[];
  contentPadding?: number;
  /** Bleed past SafeAreaView (auth-style full-bleed). */
  bleed?: boolean;
};

/**
 * Screen wrapper. The AuroraBackground is rendered once at root (`app/_layout.tsx`)
 * so Screen itself stays transparent and just provides safe-area + padding.
 */
export function Screen({
  children,
  scroll = false,
  refreshControl,
  edges = ["top", "bottom"],
  contentPadding = 20,
  bleed = false,
  ...rest
}: Props) {
  const inner = (
    <YStack flex={1} padding={contentPadding} gap="$3" {...rest}>
      {children}
    </YStack>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={bleed ? [] : edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            style={{ backgroundColor: "transparent" }}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </View>
  );
}
