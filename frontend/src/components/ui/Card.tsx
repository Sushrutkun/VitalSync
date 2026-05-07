import { styled, YStack } from "tamagui";

export const Card = styled(YStack, {
  backgroundColor: "$card",
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: "$borderColor",
  gap: 8,

  variants: {
    elevated: {
      true: {
        backgroundColor: "$cardElevated",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      },
    },
    interactive: {
      true: {
        pressStyle: { scale: 0.98, opacity: 0.9 },
        animation: "100ms",
      },
    },
  } as const,
});
