import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { healthApi } from "@/src/api/health";
import { ensureHealthPermissions, getHealthConnectStatus } from "@/src/health/permissions";
import { syncLastMinute } from "@/src/health/sync";
import { ApiError } from "@/src/lib/api";

function todayUtc(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export default function TodayScreen() {
  const date = todayUtc();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ["summary", date],
    queryFn: () => healthApi.summary(date),
    retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2,
  });

  const onSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const status = await getHealthConnectStatus();
    if (status !== "available") {
      setSyncMessage(
        status === "provider-update-required"
          ? "Update Health Connect from the Play Store to continue."
          : "Health Connect is not available on this device.",
      );
      setSyncing(false);
      return;
    }
    const perm = await ensureHealthPermissions();
    if (!perm.granted) {
      setSyncMessage("Health Connect permissions were not granted.");
      setSyncing(false);
      return;
    }
    const result = await syncLastMinute();
    setSyncMessage(
      result.ok
        ? result.result.duplicate
          ? "Already synced (duplicate)."
          : "Synced last minute."
        : `Sync failed: ${result.reason}`,
    );
    void summary.refetch();
    setSyncing(false);
  };

  const isNotFound = summary.error instanceof ApiError && summary.error.status === 404;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={summary.isFetching} onRefresh={() => summary.refetch()} />
        }
      >
        <Text style={styles.heading}>Today</Text>
        <Text style={styles.subheading}>{format(new Date(), "EEEE, d MMM yyyy")}</Text>

        {summary.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : isNotFound ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No data yet for today.</Text>
            <Text style={styles.emptyHint}>Tap &quot;Sync now&quot; to upload your latest readings.</Text>
          </View>
        ) : summary.error ? (
          <Text style={styles.error}>
            {summary.error instanceof ApiError ? summary.error.message : "Could not load summary."}
          </Text>
        ) : summary.data ? (
          <View style={styles.cards}>
            <Stat label="Steps" value={summary.data.steps?.toLocaleString() ?? "—"} />
            <Stat
              label="Active calories"
              value={
                summary.data.activeCaloriesKcal != null
                  ? `${Math.round(summary.data.activeCaloriesKcal)} kcal`
                  : "—"
              }
            />
            <Stat
              label="Avg heart rate"
              value={
                summary.data.avgHeartRateBpm != null ? `${summary.data.avgHeartRateBpm} bpm` : "—"
              }
            />
            <Stat
              label="Resting heart rate"
              value={
                summary.data.restingHeartRateBpm != null
                  ? `${summary.data.restingHeartRateBpm} bpm`
                  : "—"
              }
            />
            <Stat
              label="Blood oxygen"
              value={
                summary.data.bloodOxygenPct != null ? `${summary.data.bloodOxygenPct}%` : "—"
              }
            />
            <Stat
              label="Sleep"
              value={
                summary.data.sleepDurationMinutes != null
                  ? `${Math.floor(summary.data.sleepDurationMinutes / 60)}h ${summary.data.sleepDurationMinutes % 60}m`
                  : "—"
              }
            />
          </View>
        ) : null}

        <Pressable
          style={[styles.button, syncing && styles.buttonDisabled]}
          disabled={syncing}
          onPress={onSyncNow}
        >
          {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sync now</Text>}
        </Pressable>
        {syncMessage && <Text style={styles.syncMessage}>{syncMessage}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f8" },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: "700" },
  subheading: { fontSize: 14, color: "#666", marginTop: 2, marginBottom: 20 },
  center: { padding: 40, alignItems: "center" },
  empty: { padding: 24, alignItems: "center" },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#333" },
  emptyHint: { fontSize: 14, color: "#666", marginTop: 4, textAlign: "center" },
  error: { color: "#d33", padding: 12 },
  cards: { gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardLabel: { fontSize: 14, color: "#666" },
  cardValue: { fontSize: 18, fontWeight: "600", color: "#111" },
  button: {
    marginTop: 24,
    backgroundColor: "#0a7",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  syncMessage: { textAlign: "center", color: "#444", marginTop: 12, fontSize: 13 },
});
