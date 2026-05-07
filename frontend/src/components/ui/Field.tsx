import { Input as TInput, Label, Text, YStack, type InputProps } from "tamagui";

type Props = {
  label: string;
  error?: string;
} & InputProps;

export function Field({ label, error, ...inputProps }: Props) {
  return (
    <YStack gap="$2">
      <Label fontSize={13} fontWeight="600" color="$color">
        {label}
      </Label>
      <TInput
        size="$5"
        borderRadius={12}
        borderWidth={1}
        borderColor={error ? "$danger" : "$borderColor"}
        backgroundColor="$card"
        color="$color"
        placeholderTextColor="$placeholderColor"
        focusStyle={{ borderColor: "$accent" }}
        {...inputProps}
      />
      {error ? (
        <Text fontSize={12} color="$danger">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
