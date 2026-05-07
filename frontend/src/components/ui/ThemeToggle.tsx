import { useThemePref } from "@/src/theme/ThemeProvider";
import type { ThemePreference } from "@/src/theme/tokens";
import { XStack, styled, Text } from "tamagui";

const Segment = styled(Text, {
  flex: 1,
  textAlign: "center",
  paddingVertical: 8,
  fontSize: 13,
  fontWeight: "600",
  color: "$muted",
  borderRadius: 8,

  variants: {
    active: {
      true: {
        backgroundColor: "$accent",
        color: "#0B0B0F",
      },
    },
  } as const,
});

const OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useThemePref();
  return (
    <XStack
      backgroundColor="$card"
      borderRadius={10}
      padding={4}
      borderWidth={1}
      borderColor="$borderColor"
      gap={4}
    >
      {OPTIONS.map((o) => (
        <Segment
          key={o.value}
          active={preference === o.value}
          onPress={() => void setPreference(o.value)}
        >
          {o.label}
        </Segment>
      ))}
    </XStack>
  );
}
