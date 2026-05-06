import type { ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import { styled, Text, XStack, type XStackProps } from "tamagui";

const Base = styled(XStack, {
  borderRadius: 12,
  height: 50,
  paddingHorizontal: 18,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  pressStyle: { opacity: 0.85 },

  variants: {
    intent: {
      primary: {
        backgroundColor: "$accent",
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: "$card",
        borderColor: "$borderColor",
        borderWidth: 1,
      },
      ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
      },
      danger: {
        backgroundColor: "$danger",
        borderWidth: 0,
      },
    },
    appSize: {
      sm: { height: 36, paddingHorizontal: 12, borderRadius: 10 },
      md: { height: 44, paddingHorizontal: 16 },
      lg: { height: 52, paddingHorizontal: 20 },
    },
  } as const,

  defaultVariants: {
    intent: "primary",
    appSize: "lg",
  },
});

const TEXT_COLOR: Record<string, string> = {
  primary: "#0B0B0F",
  secondary: "$color",
  ghost: "$color",
  danger: "#FFFFFF",
};

const FONT_SIZE: Record<string, number> = { sm: 13, md: 14, lg: 16 };

type Props = XStackProps & {
  intent?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
};

export function Button({
  loading,
  disabled,
  children,
  intent = "primary",
  size = "lg",
  ...rest
}: Props) {
  const spinnerColor =
    intent === "primary" ? "#0B0B0F" : intent === "danger" ? "#FFFFFF" : undefined;
  return (
    <Base
      intent={intent}
      appSize={size}
      disabled={disabled || loading}
      opacity={disabled || loading ? 0.6 : 1}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : typeof children === "string" ? (
        <Text fontSize={FONT_SIZE[size]} fontWeight="600" color={TEXT_COLOR[intent] as any}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Base>
  );
}
