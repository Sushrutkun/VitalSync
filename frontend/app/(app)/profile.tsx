import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";
import { z } from "zod";

import { usersApi } from "@/src/api/users";
import { useAuth } from "@/src/auth/AuthContext";
import { Body, Button, Card, Field, Heading } from "@/src/components/ui";
import { useThemePref } from "@/src/theme/ThemeProvider";
import { ApiError } from "@/src/lib/api";
import { brand, gradients } from "@/src/theme/tokens";
import type { ThemePreference } from "@/src/theme/tokens";
import type { UpdateProfileRequest, UserProfile } from "@/src/types/api";

const numberInRange = (min: number, max: number) =>
  z.string().refine(
    (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    `Must be between ${min} and ${max}`,
  );

const schema = z.object({
  name: z.string().max(100),
  heightCm: numberInRange(50, 300),
  weightKg: numberInRange(10, 500),
  dateOfBirth: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD"),
});

type FormValues = z.infer<typeof schema>;

function parseOptionalNumber(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { preference, setPreference } = useThemePref();
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.me(),
  });

  const update = useMutation({
    mutationFn: (patch: UpdateProfileRequest) => usersApi.updateMe(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      setSavedMessage("Saved.");
    },
  });

  const handleThemeChange = async (next: ThemePreference) => {
    await setPreference(next);
    usersApi.updateMe({ themePreference: next }).catch(() => {/* silent — local change still applies */});
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", heightCm: "", weightKg: "", dateOfBirth: "" },
  });

  useEffect(() => {
    if (profile.data) {
      reset({
        name: profile.data.name,
        heightCm: profile.data.heightCm != null ? String(profile.data.heightCm) : "",
        weightKg: profile.data.weightKg != null ? String(profile.data.weightKg) : "",
        dateOfBirth: profile.data.dateOfBirth ?? "",
      });
      if (profile.data.themePreference) {
        void setPreference(profile.data.themePreference as ThemePreference);
      }
    }
  }, [profile.data, reset, setPreference]);

  const onSubmit = (values: FormValues) => {
    setSavedMessage(null);
    const patch: UpdateProfileRequest = {
      name: values.name.trim() !== "" ? values.name : (profile.data?.name ?? ""),
      heightCm: parseOptionalNumber(values.heightCm),
      weightKg: parseOptionalNumber(values.weightKg),
      dateOfBirth: values.dateOfBirth.length > 0 ? values.dateOfBirth : undefined,
    };
    update.mutate(patch);
  };

  if (profile.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top", "bottom"]}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={brand.accent} />
        </YStack>
      </SafeAreaView>
    );
  }

  if (profile.error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top", "bottom"]}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding={20}>
          <Body tone="danger">
            {profile.error instanceof ApiError ? profile.error.message : "Could not load profile."}
          </Body>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack gap={6}>
            <Body tone="muted" eyebrow>
              Your account
            </Body>
            <Heading level={1}>Profile.</Heading>
          </YStack>

          {profile.data ? <ProfileHero profile={profile.data} /> : null}
          {profile.data ? <AccountInfo profile={profile.data} /> : null}

          <YStack gap={10}>
            <Heading level={3}>Appearance</Heading>
            <ThemeToggleWithPersist preference={preference} onPress={handleThemeChange} />
          </YStack>

          <YStack gap={14}>
            <Heading level={3}>Details</Heading>
            <Card padding={20} gap={18}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Date of birth (YYYY-MM-DD)"
                    placeholder="1995-06-15"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    error={errors.dateOfBirth?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="heightCm"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Height (cm)"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.heightCm?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="weightKg"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Weight (kg)"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.weightKg?.message}
                  />
                )}
              />
            </Card>
          </YStack>

          {update.error ? (
            <Body tone="danger" textAlign="center">
              {update.error instanceof ApiError ? update.error.message : "Could not save."}
            </Body>
          ) : null}
          {savedMessage ? (
            <Body tone="accent" textAlign="center">
              {savedMessage}
            </Body>
          ) : null}

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || update.isPending}
            loading={update.isPending}
          >
            Save changes
          </Button>

          <YStack alignItems="center" marginTop={12}>
            <Button intent="ghost" onPress={() => void logout()}>
              <XStack alignItems="center" gap={8}>
                <Ionicons name="log-out-outline" size={16} color={brand.coral} />
                <Text
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize={13}
                  letterSpacing={1.6}
                  color={brand.coral as any}
                  style={{ textTransform: "uppercase" }}
                >
                  Sign out
                </Text>
              </XStack>
            </Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfileHero({ profile }: { profile: UserProfile }) {
  return (
    <YStack alignItems="center" gap={14} paddingVertical={8}>
      {/* Gradient ring */}
      <View
        style={{
          width: 124,
          height: 124,
          borderRadius: 62,
          padding: 3,
        }}
      >
        <LinearGradient
          colors={[gradients.aurora[0], gradients.aurora[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 62, padding: 3 }}
        >
          <YStack
            flex={1}
            borderRadius={62}
            alignItems="center"
            justifyContent="center"
            backgroundColor="#0B1426"
          >
            <Text
              fontFamily="$heading"
              fontStyle="italic"
              fontSize={48}
              color={brand.accent as any}
            >
              {initials(profile.name)}
            </Text>
          </YStack>
        </LinearGradient>
      </View>
      <YStack alignItems="center" gap={4}>
        <Heading level={2}>{profile.name}</Heading>
        <XStack alignItems="center" gap={6}>
          <Ionicons name="mail-outline" size={12} color={brand.dark.muted} />
          <Body tone="muted" size="sm">
            {profile.email}
          </Body>
        </XStack>
      </YStack>
    </YStack>
  );
}

function AccountInfo({ profile }: { profile: UserProfile }) {
  return (
    <YStack gap={10}>
      <Heading level={3}>Account</Heading>
      <Card padding={18} gap={2}>
        <Row label="Username" value={profile.email.split("@")[0]} />
        <Row label="Email" value={profile.email} />
        <Row label="User ID" value={profile.id.slice(0, 8)} />
        <Row label="Member since" value={format(new Date(profile.createdAt), "d MMM yyyy")} />
      </Card>
    </YStack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={10}
      gap={12}
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Body tone="muted" size="sm">
        {label}
      </Body>
      <Body weight="medium" numberOfLines={1} flexShrink={1} textAlign="right">
        {value}
      </Body>
    </XStack>
  );
}

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "System", value: "system" },
  { label: "Dark", value: "dark" },
];

function ThemeToggleWithPersist({
  preference,
  onPress,
}: {
  preference: ThemePreference;
  onPress: (next: ThemePreference) => void;
}) {
  return (
    <XStack
      backgroundColor="rgba(255,255,255,0.04)"
      borderRadius={999}
      padding={4}
      borderWidth={1}
      borderColor="$borderColor"
      gap={4}
      alignSelf="flex-start"
    >
      {THEME_OPTIONS.map((o) => {
        const active = preference === o.value;
        return (
          <Pressable key={o.value} onPress={() => onPress(o.value)}>
            <YStack
              width={64}
              height={36}
              borderRadius={999}
              alignItems="center"
              justifyContent="center"
              backgroundColor={active ? brand.accent : "transparent"}
            >
              <Text
                fontFamily="$body"
                fontSize={13}
                color={active ? "#0B1426" : (brand.dark.muted as any)}
                fontWeight="600"
              >
                {o.label}
              </Text>
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}
