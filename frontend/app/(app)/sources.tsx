import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import { sourcesApi } from "@/src/api/sources";
import { useSources } from "@/src/sources/SourcesContext";
import { startOAuthConnect } from "@/src/sources/oauth";
import type { SourceStatusDto } from "@/src/sources/types";
import type { HealthSource } from "@/src/types/api";

const colors = {
  bg: "#0a0a0c",
  card: "#1a1d22",
  border: "#2a2f36",
  text: "#e8eaed",
  muted: "#8a929e",
  ok: "#69d4a8",
  warn: "#f5b754",
  err: "#ef6b6b",
  accent: "#6cf0c2",
};

const SOURCE_LABELS: Record<HealthSource, string> = {
  HEALTH_CONNECT: "Google Health Connect",
  HEALTHKIT: "Apple Health",
  GADGETBRIDGE: "Gadgetbridge (BLE wearables)",
  FITBIT: "Fitbit",
  STRAVA: "Strava",
  WHOOP: "WHOOP",
};

const SOURCE_TAGS: Record<HealthSource, string> = {
  HEALTH_CONNECT: "Android",
  HEALTHKIT: "iOS",
  GADGETBRIDGE: "Boat · Noise · Fastrack · Amazfit",
  FITBIT: "Cloud",
  STRAVA: "Cloud",
  WHOOP: "Cloud",
};

export default function SourcesScreen() {
  const router = useRouter();
  const { sources, loading, error, refresh } = useSources();
  const [busy, setBusy] = useState<HealthSource | null>(null);

  async function handleConnect(source: HealthSource) {
    setBusy(source);
    try {
      const res = await sourcesApi.connect(source);
      if (res.flow === "OAUTH") {
        const result = await startOAuthConnect(source);
        if (result.ok) {
          await refresh();
        } else if (result.reason === "error") {
          Alert.alert("Connect failed", result.detail ?? "Unknown error");
        }
      } else if (res.flow === "CREDENTIALS") {
        Alert.alert(
          "Credentials form coming soon",
          `Will collect: ${res.fields?.join(", ")}. Lands in Phase 3.`,
        );
      } else {
        Alert.alert("Device source", res.instructions ?? "Configure on device.");
      }
    } catch (e) {
      Alert.alert("Connect failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect(source: HealthSource) {
    Alert.alert("Disconnect " + SOURCE_LABELS[source] + "?", "This removes stored credentials.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          setBusy(source);
          try {
            await sourcesApi.disconnect(source);
            await refresh();
          } catch (e) {
            Alert.alert("Disconnect failed", e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Data Sources</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 80 }}>
        {loading && sources.length === 0 ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : null}

        {error ? <Text style={styles.errText}>{error}</Text> : null}

        {sources.map((s) => (
          <SourceCard
            key={s.source}
            source={s}
            busy={busy === s.source}
            onConnect={() => handleConnect(s.source)}
            onDisconnect={() => handleDisconnect(s.source)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SourceCard({
  source,
  busy,
  onConnect,
  onDisconnect,
}: {
  source: SourceStatusDto;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const isConnected = source.status === "CONNECTED";
  const statusColor = isConnected
    ? colors.ok
    : source.status === "ERROR" || source.status === "EXPIRED"
    ? colors.err
    : colors.muted;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{SOURCE_LABELS[source.source]}</Text>
          <Text style={styles.cardTag}>{SOURCE_TAGS[source.source]}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <Text style={[styles.statusText, { color: statusColor }]}>
        {source.status.replace("_", " ").toLowerCase()}
      </Text>

      {source.lastPolledAt ? (
        <Text style={styles.metaText}>
          Last polled: {new Date(source.lastPolledAt).toLocaleString()}
        </Text>
      ) : null}

      {source.lastError ? (
        <Text style={[styles.metaText, { color: colors.err }]}>{source.lastError}</Text>
      ) : null}

      <View style={styles.actions}>
        {isConnected ? (
          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={onDisconnect}
            disabled={busy}
          >
            <Text style={styles.btnDangerText}>{busy ? "..." : "Disconnect"}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={onConnect}
            disabled={busy}
          >
            <Text style={styles.btnPrimaryText}>{busy ? "..." : "Connect"}</Text>
          </Pressable>
        )}
      </View>
    </View>
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
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  errText: { color: colors.err, fontSize: 13, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  cardTag: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 4 },
  metaText: { color: colors.muted, fontSize: 11, fontFamily: "Menlo" },
  actions: { flexDirection: "row", marginTop: 10 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnPrimary: { backgroundColor: colors.accent },
  btnPrimaryText: { color: "#0a0a0c", fontWeight: "700", fontSize: 13 },
  btnDanger: { borderWidth: 1, borderColor: colors.err },
  btnDangerText: { color: colors.err, fontWeight: "700", fontSize: 13 },
});
