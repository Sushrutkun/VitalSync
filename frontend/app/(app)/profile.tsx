import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { usersApi } from "@/src/api/users";
import { useAuth } from "@/src/auth/AuthContext";
import { ApiError } from "@/src/lib/api";
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

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
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
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (profile.error) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={styles.error}>
            {profile.error instanceof ApiError ? profile.error.message : "Could not load profile."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Profile</Text>
          {profile.data && <ReadOnly profile={profile.data} />}

          <Field control={control} name="name" label="Name" error={errors.name?.message} />
          <Field
            control={control}
            name="dateOfBirth"
            label="Date of birth (YYYY-MM-DD)"
            placeholder="1995-06-15"
            error={errors.dateOfBirth?.message}
          />
          <Field
            control={control}
            name="heightCm"
            label="Height (cm)"
            keyboardType="numeric"
            error={errors.heightCm?.message}
          />
          <Field
            control={control}
            name="weightKg"
            label="Weight (kg)"
            keyboardType="numeric"
            error={errors.weightKg?.message}
          />

          {update.error && (
            <Text style={styles.submitError}>
              {update.error instanceof ApiError ? update.error.message : "Could not save."}
            </Text>
          )}
          {savedMessage && <Text style={styles.savedMessage}>{savedMessage}</Text>}

          <Pressable
            style={[styles.button, (!isDirty || update.isPending) && styles.buttonDisabled]}
            disabled={!isDirty || update.isPending}
            onPress={handleSubmit(onSubmit)}
          >
            {update.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </Pressable>

          <Pressable style={styles.logout} onPress={() => void logout()}>
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReadOnly({ profile }: { profile: UserProfile }) {
  return (
    <View style={styles.readOnly}>
      <Row label="Email" value={profile.email} />
      <Row label="Member since" value={format(new Date(profile.createdAt), "d MMM yyyy")} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type FieldProps = {
  control: ReturnType<typeof useForm<FormValues>>["control"];
  name: keyof FormValues;
  label: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  error?: string;
};

function Field({ control, name, label, placeholder, keyboardType, error }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize="none"
            value={value === undefined || value === null ? "" : String(value)}
            onChangeText={onChange}
            onBlur={onBlur}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f8" },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  readOnly: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { color: "#666", fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "600", color: "#111" },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#d33" },
  errorText: { color: "#d33", fontSize: 13, marginTop: 4 },
  submitError: { color: "#d33", textAlign: "center", marginVertical: 8 },
  savedMessage: { color: "#0a7", textAlign: "center", marginVertical: 8 },
  button: {
    marginTop: 8,
    backgroundColor: "#0a7",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logout: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#d33", fontWeight: "600", fontSize: 15 },
  error: { color: "#d33" },
});
