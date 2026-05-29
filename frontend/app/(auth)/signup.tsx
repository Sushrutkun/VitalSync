import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { YStack } from "tamagui";
import { z } from "zod";

import { Body, Button, Field, Screen } from "@/src/components/ui";
import { useAuth } from "@/src/auth/AuthContext";
import { ApiError } from "@/src/lib/api";

import { BrandMark } from "./login";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const { signup } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await signup(values.email, values.password, values.name);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        setSubmitError("An account with this email already exists.");
      } else if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Could not reach the server. Check your connection.");
      }
    }
  };

  return (
    <Screen scroll contentPadding={28}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <YStack flex={1} justifyContent="center" gap={28}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <YStack gap={12} alignItems="center" marginBottom={20}>
              <BrandMark />
              <Body tone="secondary" size="md" textAlign="center" letterSpacing={0.5}>
                Begin tracking your inner weather.
              </Body>
            </YStack>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <YStack gap={22}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Full name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Jane Smith"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                  />
                )}
              />

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
            </YStack>
          </Animated.View>

          {submitError ? (
            <Body tone="danger" textAlign="center">
              {submitError}
            </Body>
          ) : null}

          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Create account
            </Button>
          </Animated.View>

          <Link href="/(auth)/login" asChild>
            <Body tone="muted" textAlign="center" marginTop={6}>
              Already have an account?{" "}
              <Body tone="accent" weight="semibold">
                Sign in
              </Body>
            </Body>
          </Link>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
