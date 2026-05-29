import { styled, Text } from "tamagui";

export const Heading = styled(Text, {
  color: "$color",
  fontFamily: "$heading",
  fontWeight: "400",

  variants: {
    level: {
      1: {
        fontSize: 44,
        lineHeight: 48,
        letterSpacing: -0.8,
        fontStyle: "italic",
      },
      2: {
        fontSize: 30,
        lineHeight: 36,
        letterSpacing: -0.4,
      },
      3: {
        fontFamily: "$body",
        fontSize: 13,
        lineHeight: 18,
        letterSpacing: 2,
        fontWeight: "600",
        textTransform: "uppercase" as any,
      },
      4: {
        fontFamily: "$body",
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 1.5,
        fontWeight: "600",
        textTransform: "uppercase" as any,
      },
    },
  } as const,

  defaultVariants: { level: 1 },
});

export const Body = styled(Text, {
  color: "$color",
  fontFamily: "$body",
  fontSize: 14,
  lineHeight: 20,

  variants: {
    tone: {
      default: { color: "$color" },
      muted: { color: "$muted" },
      accent: { color: "$accent" },
      danger: { color: "$danger" },
      violet: { color: "$violet" as any },
      secondary: { color: "$colorSecondary" as any },
    },
    size: {
      xs: { fontSize: 11, lineHeight: 14 },
      sm: { fontSize: 13, lineHeight: 18 },
      md: { fontSize: 14, lineHeight: 20 },
      lg: { fontSize: 16, lineHeight: 22 },
      xl: { fontSize: 18, lineHeight: 24 },
    },
    weight: {
      regular: { fontWeight: "400" },
      medium: { fontWeight: "500" },
      semibold: { fontWeight: "600" },
      bold: { fontWeight: "700" },
    },
    /** Editorial serif italic — for inline numerics or accents. */
    editorial: {
      true: {
        fontFamily: "$heading",
        fontStyle: "italic",
        fontWeight: "400",
      },
    },
    /** Tracking-wide uppercase eyebrow text. */
    eyebrow: {
      true: {
        textTransform: "uppercase" as any,
        letterSpacing: 1.8,
        fontSize: 11,
        fontWeight: "600",
        lineHeight: 14,
      },
    },
  } as const,

  defaultVariants: { tone: "default", size: "md", weight: "regular" },
});
