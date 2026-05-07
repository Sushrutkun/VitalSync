import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform } from "react-native";
import { YStack } from "tamagui";
import { z } from "zod";

import { Body, Button, Field, Heading, Screen } from "@/src/components/ui";
import { useAuth } from "@/src/auth/AuthContext";
import { ApiError } from "@/src/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        setSubmitError("Email or password is incorrect.");
      } else if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Could not reach the server. Check your connection.");
      }
    }
  };

  return (
    <Screen scroll contentPadding={24}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <YStack flex={1} justifyContent="center" gap="$4">
          <YStack gap="$2" alignItems="center" marginBottom="$6">
            <Heading level={1}>VitalSync</Heading>
            <Body tone="muted">Sign in to continue</Body>
          </YStack>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Password"
                secureTextEntry
                autoCapitalize="none"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          {submitError ? (
            <Body tone="danger" textAlign="center">
              {submitError}
            </Body>
          ) : null}

          <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} marginTop="$2">
            Sign in
          </Button>

          <Link href="/(auth)/signup" asChild>
            <Body tone="accent" textAlign="center" marginTop="$3">
              Don&apos;t have an account? Sign up
            </Body>
          </Link>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
