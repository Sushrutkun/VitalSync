import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";
import { z } from "zod";

import { usersApi } from "@/src/api/users";
import { useAuth } from "@/src/auth/AuthContext";
import { Body, Button, Card, Field, Heading, ThemeToggle } from "@/src/components/ui";
import { ApiError } from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";
import type { UpdateProfileRequest, UserProfile } from "@/src/types/api";

const numberInRange = (min: number, max: number) =>
  z.string().refine(
    (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    `Must be between ${min} and ${max}`,
  );

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
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
  const theme = useTheme();
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
    }
  }, [profile.data, reset]);

  const onSubmit = (values: FormValues) => {
    setSavedMessage(null);
    const patch: UpdateProfileRequest = {
      name: values.name,
      heightCm: parseOptionalNumber(values.heightCm),
      weightKg: parseOptionalNumber(values.weightKg),
      dateOfBirth: values.dateOfBirth.length > 0 ? values.dateOfBirth : undefined,
    };
    update.mutate(patch);
  };

  if (profile.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={["top", "bottom"]}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={theme.accent?.val} />
        </YStack>
      </SafeAreaView>
    );
  }

  if (profile.error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={["top", "bottom"]}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding={20}>
          <Body tone="danger">
            {profile.error instanceof ApiError ? profile.error.message : "Could not load profile."}
          </Body>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Heading level={1}>Profile</Heading>

          {profile.data ? <ProfileHero profile={profile.data} /> : null}
          {profile.data ? <AccountInfo profile={profile.data} /> : null}

          <Card gap={10} padding={16}>
            <Body tone="muted" size="sm" weight="semibold">
              APPEARANCE
            </Body>
            <ThemeToggle />
          </Card>

          <YStack gap={12}>
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

          <Card gap={10} padding={16} marginTop="$3">
            <Body tone="muted" size="sm" weight="semibold">
              ACCOUNT
            </Body>
            <Button intent="danger" onPress={() => void logout()}>
              <XStack alignItems="center" gap={8}>
                <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                <Body weight="semibold" color="#FFFFFF">
                  Sign out
                </Body>
              </XStack>
            </Button>
          </Card>
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
    <Card elevated gap={12} padding={20} alignItems="center">
      <YStack
        width={84}
        height={84}
        borderRadius={42}
        alignItems="center"
        justifyContent="center"
        backgroundColor={brand.accent as any}
      >
        <Body fontSize={32} weight="bold" color="#0B0B0F">
          {initials(profile.name)}
        </Body>
      </YStack>
      <YStack alignItems="center" gap={2}>
        <Body size="lg" weight="bold" fontSize={20}>
          {profile.name}
        </Body>
        <XStack alignItems="center" gap={6}>
          <Ionicons name="mail-outline" size={14} color={brand.dark.muted} />
          <Body tone="muted" size="sm">
            {profile.email}
          </Body>
        </XStack>
      </YStack>
    </Card>
  );
}

function AccountInfo({ profile }: { profile: UserProfile }) {
  return (
    <Card gap={6} padding={16}>
      <Body tone="muted" size="sm" weight="semibold">
        DETAILS
      </Body>
      <Row label="Username" value={profile.email.split("@")[0]} />
      <Row label="Email" value={profile.email} />
      <Row label="User ID" value={profile.id.slice(0, 8)} />
      <Row label="Member since" value={format(new Date(profile.createdAt), "d MMM yyyy")} />
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" paddingVertical={4} gap={12}>
      <Body tone="muted">{label}</Body>
      <Body weight="semibold" numberOfLines={1} flexShrink={1} textAlign="right">
        {value}
      </Body>
    </XStack>
  );
}
