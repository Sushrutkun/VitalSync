import { useState } from "react";
import { Input as TInput, Text, YStack, type InputProps } from "tamagui";

type Props = {
  label: string;
  error?: string;
} & InputProps;

export function Field({ label, error, onFocus, onBlur, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? "$danger" : focused ? "$accent" : "$borderColor";
  return (
    <YStack gap={6}>
      <Text
        fontFamily="$body"
        fontSize={10}
        fontWeight="600"
        letterSpacing={2}
        color="$muted"
        style={{ textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <TInput
        unstyled
        fontFamily="$body"
        fontSize={16}
        height={44}
        paddingHorizontal={2}
        borderRadius={0}
        borderWidth={0}
        borderBottomWidth={1}
        borderBottomColor={borderColor as any}
        backgroundColor="transparent"
        color="$color"
        placeholderTextColor="$placeholderColor"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...inputProps}
      />
      {error ? (
        <Text fontFamily="$body" fontSize={12} color="$danger">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
