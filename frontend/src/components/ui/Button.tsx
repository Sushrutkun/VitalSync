import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type PressableProps, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "tamagui";

import { brand, gradients } from "@/src/theme/tokens";

type Intent = "primary" | "secondary" | "ghost" | "danger" | "violet";
type Size = "sm" | "md" | "lg";

type Props = Omit<PressableProps, "children" | "style"> & {
  intent?: Intent;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
  marginTop?: number | string;
};

const HEIGHT: Record<Size, number> = { sm: 38, md: 46, lg: 54 };
const FONT_SIZE: Record<Size, number> = { sm: 12, md: 13, lg: 14 };
const PADDING_H: Record<Size, number> = { sm: 16, md: 22, lg: 28 };

export function Button({
  intent = "primary",
  size = "lg",
  loading,
  disabled,
  children,
  onPress,
  marginTop,
  ...rest
}: Props) {
  const h = HEIGHT[size];
  const fontSize = FONT_SIZE[size];
  const padH = PADDING_H[size];
  const radius = 999;

  const isString = typeof children === "string";
  const isDisabled = disabled || loading;

  const textColor = textColorFor(intent);
  const spinnerColor = textColor === "#FFFFFF" ? "#FFFFFF" : "#0B1426";

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: padH,
        height: h,
      }}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : isString ? (
        <Text
          fontFamily="$body"
          fontWeight="600"
          fontSize={fontSize}
          letterSpacing={1.6}
          color={textColor as any}
          style={{ textTransform: "uppercase" }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  const pressable = (inner: ReactNode) => (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        borderRadius: radius,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        marginTop: marginTop as any,
        overflow: "hidden",
      })}
      {...rest}
    >
      {inner}
    </Pressable>
  );

  if (intent === "primary" || intent === "danger" || intent === "violet") {
    const stops =
      intent === "primary"
        ? gradients.recovery
        : intent === "danger"
          ? gradients.danger
          : gradients.violet;
    return pressable(
      <LinearGradient
        colors={[stops[0], stops[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius }}
      >
        {content}
      </LinearGradient>,
    );
  }

  if (intent === "secondary") {
    return pressable(
      <View
        style={{
          borderRadius: radius,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      >
        {content}
      </View>,
    );
  }

  // ghost
  return pressable(<View style={{ borderRadius: radius }}>{content}</View>);
}

function textColorFor(intent: Intent): string {
  switch (intent) {
    case "primary":
      return "#0B1426";
    case "violet":
      return "#FFFFFF";
    case "danger":
      return "#FFFFFF";
    case "secondary":
      return brand.dark.text;
    case "ghost":
      return brand.accent;
  }
}
