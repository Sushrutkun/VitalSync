import { styled, Text } from "tamagui";

export const Heading = styled(Text, {
  color: "$color",
  fontWeight: "700",

  variants: {
    level: {
      1: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
      2: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
      3: { fontSize: 18, lineHeight: 24 },
      4: { fontSize: 15, lineHeight: 20 },
    },
  } as const,

  defaultVariants: { level: 1 },
});

export const Body = styled(Text, {
  color: "$color",
  fontSize: 14,
  lineHeight: 20,

  variants: {
    tone: {
      default: { color: "$color" },
      muted: { color: "$muted" },
      accent: { color: "$accent" },
      danger: { color: "$danger" },
    },
    size: {
      xs: { fontSize: 11, lineHeight: 14 },
      sm: { fontSize: 13, lineHeight: 18 },
      md: { fontSize: 14, lineHeight: 20 },
      lg: { fontSize: 16, lineHeight: 22 },
    },
    weight: {
      regular: { fontWeight: "400" },
      medium: { fontWeight: "500" },
      semibold: { fontWeight: "600" },
      bold: { fontWeight: "700" },
    },
  } as const,

  defaultVariants: { tone: "default", size: "md", weight: "regular" },
});
