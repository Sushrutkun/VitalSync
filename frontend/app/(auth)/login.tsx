import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Text, YStack } from "tamagui";
import { z } from "zod";

import { Body, Button, Field, Screen } from "@/src/components/ui";
import { useAuth } from "@/src/auth/AuthContext";
import { ApiError } from "@/src/lib/api";
import { brand, gradients } from "@/src/theme/tokens";

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
                Track the signal, not the noise.
              </Body>
            </YStack>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <YStack gap={22}>
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
            <YStack gap={12}>
              <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
                Sign in
              </Button>

              <Divider />

              <GoogleButton onPress={() => {}} disabled />
            </YStack>
          </Animated.View>

          <Link href="/(auth)/signup" asChild>
            <Body tone="muted" textAlign="center" marginTop={6}>
              Don&apos;t have an account?{" "}
              <Body tone="accent" weight="semibold">
                Create one
              </Body>
            </Body>
          </Link>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function Divider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.10)" }} />
      <Text fontFamily="$body" fontSize={12} color={brand.dark.muted as any}>
        or
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.10)" }} />
    </View>
  );
}

export function GoogleButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: 999,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        overflow: "hidden",
      })}
    >
      <View
        style={{
          height: 54,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.06)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <GoogleLogo />
        <Text fontFamily="$body" fontWeight="600" fontSize={13} letterSpacing={1.2} color={brand.dark.text as any} style={{ textTransform: "uppercase" }}>
          Continue with Google
        </Text>
      </View>
    </Pressable>
  );
}

function GoogleLogo() {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 2, overflow: "hidden" }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#4285F4", lineHeight: 18, textAlign: "center" }}>G</Text>
    </View>
  );
}

export function BrandMark() {
  return (
    <View style={{ height: 80, justifyContent: "center", alignItems: "center" }}>
      <LinearGradient
        colors={[gradients.aurora[0], gradients.aurora[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 4,
          paddingVertical: 2,
        }}
      >
        <Text
          fontFamily="$heading"
          fontStyle="italic"
          fontSize={56}
          lineHeight={64}
          color="#0B1426"
          letterSpacing={-1.5}
        >
          VitalSync
        </Text>
      </LinearGradient>
      <Text
        fontFamily="$body"
        fontSize={9}
        letterSpacing={4}
        fontWeight="600"
        color={brand.dark.muted as any}
        marginTop={6}
        style={{ textTransform: "uppercase" }}
      >
        body · data · light
      </Text>
    </View>
  );
}
