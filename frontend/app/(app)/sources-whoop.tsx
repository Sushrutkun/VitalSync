import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useRouter } from "expo-router";

import { sourcesApi } from "@/src/api/sources";
import { useSources } from "@/src/sources/SourcesContext";

const colors = {
  bg: "#0a0a0c",
  card: "#1a1d22",
  border: "#2a2f36",
  text: "#e8eaed",
  muted: "#8a929e",
  ok: "#69d4a8",
  err: "#ef6b6b",
  accent: "#6cf0c2",
};

export default function WhoopConnectScreen() {
  const router = useRouter();
  const { refresh } = useSources();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Both email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await sourcesApi.submitCredentials("WHOOP", { email: email.trim(), password });
      await refresh();
      router.back();
    } catch (e) {
      Alert.alert("Connect failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Connect WHOOP</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.card}>
          <Text style={styles.note}>
            WHOOP has no public OAuth. Your login is stored encrypted at rest and used only to
            fetch your daily cycles, recovery, and sleep.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            editable={!busy}
          />

          <Pressable
            style={[styles.btn, busy && { opacity: 0.5 }]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={styles.btnText}>{busy ? "Connecting…" : "Connect"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: colors.accent, fontWeight: "600", fontSize: 15 },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    fontFamily: "Menlo",
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#0a0a0c", fontWeight: "700", fontSize: 15 },
});
