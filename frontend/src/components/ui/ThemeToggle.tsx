import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { useThemePref } from "@/src/theme/ThemeProvider";
import { brand } from "@/src/theme/tokens";
import type { ThemePreference } from "@/src/theme/tokens";

const OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "System", value: "system" },
  { label: "Dark", value: "dark" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useThemePref();
  return (
    <XStack
      backgroundColor="rgba(255,255,255,0.04)"
      borderRadius={999}
      padding={4}
      borderWidth={1}
      borderColor="$borderColor"
      gap={4}
      alignSelf="flex-start"
    >
      {OPTIONS.map((o) => {
        const active = preference === o.value;
        return (
          <Pressable key={o.value} onPress={() => void setPreference(o.value)}>
            <YStack
              width={44}
              height={36}
              borderRadius={999}
              alignItems="center"
              justifyContent="center"
              backgroundColor={active ? brand.accent : "transparent"}
              shadowColor={active ? brand.accent : "transparent"}
              shadowOpacity={active ? 0.5 : 0}
              shadowRadius={active ? 12 : 0}
              shadowOffset={{ width: 0, height: 0 }}
            >
              <Text
                fontFamily="$body"
                fontSize={16}
                color={active ? "#0B1426" : (brand.dark.muted as any)}
                fontWeight="600"
              >
                {o.label}
              </Text>
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}
