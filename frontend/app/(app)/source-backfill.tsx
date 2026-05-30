import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { sourcesApi } from "@/src/api/sources";
import type { BackfillStatusDto } from "@/src/sources/types";
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

const PHASES = [
  { id: 1, label: "Last 30 days", desc: "Recent — foreground priority" },
  { id: 2, label: "Last 6 months", desc: "Background" },
  { id: 3, label: "Last 2 years", desc: "Background, throttled" },
];

export default function SourceBackfillScreen() {
  const router = useRouter();
  const { source: sourceParam } = useLocalSearchParams<{ source: string }>();
  const source = sourceParam as HealthSource;

  const [statuses, setStatuses] = useState<Record<number, BackfillStatusDto | null>>({});
  const [loading, setLoading] = useState(false);
  const [kicking, setKicking] = useState<number | null>(null);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const next: Record<number, BackfillStatusDto | null> = {};
    for (const p of PHASES) {
      try {
        next[p.id] = await sourcesApi.backfillStatus(source, p.id);
      } catch {
        next[p.id] = null;
      }
    }
    setStatuses(next);
    setLoading(false);
  }, [source]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Poll every 3s while any phase is IN_PROGRESS
  useEffect(() => {
    const anyRunning = Object.values(statuses).some((s) => s?.phaseStatus === "IN_PROGRESS");
    if (!anyRunning) return;
    const id = setInterval(() => { void refreshAll(); }, 3000);
    return () => clearInterval(id);
  }, [statuses, refreshAll]);

  async function start(phase: number) {
    setKicking(phase);
    try {
      const res = await sourcesApi.startBackfill(source, phase);
      setStatuses((prev) => ({ ...prev, [phase]: res }));
    } catch (e) {
      Alert.alert("Failed to start", e instanceof Error ? e.message : String(e));
    } finally {
      setKicking(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{source} Backfill</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 80 }}>
        {loading && Object.keys(statuses).length === 0 ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : null}

        {PHASES.map((p) => {
          const s = statuses[p.id];
          return (
            <PhaseCard
              key={p.id}
              phaseId={p.id}
              label={p.label}
              desc={p.desc}
              status={s}
              kicking={kicking === p.id}
              onStart={() => start(p.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function PhaseCard({
  phaseId,
  label,
  desc,
  status,
  kicking,
  onStart,
}: {
  phaseId: number;
  label: string;
  desc: string;
  status: BackfillStatusDto | null;
  kicking: boolean;
  onStart: () => void;
}) {
  const phaseStatus = status?.phaseStatus ?? "PENDING";
  const pct = status?.percentComplete ?? 0;

  const color =
    phaseStatus === "DONE" ? colors.ok :
    phaseStatus === "IN_PROGRESS" ? colors.warn :
    phaseStatus === "FAILED" ? colors.err : colors.muted;

  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Phase {phaseId} — {label}</Text>
          <Text style={styles.cardDesc}>{desc}</Text>
        </View>
        <Text style={[styles.statusBadge, { color }]}>
          {status ? phaseStatus.toLowerCase() : "not started"}
        </Text>
      </View>

      {status && status.totalDays > 0 ? (
        <View style={{ marginTop: 8 }}>
          <View style={styles.progressOuter}>
            <View style={[styles.progressInner, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.metaText}>
            {status.daysSynced} / {status.totalDays} days · cursor: {status.cursorDate ?? "—"}
          </Text>
        </View>
      ) : null}

      {status?.lastError ? (
        <Text style={[styles.metaText, { color: colors.err, marginTop: 6 }]}>
          {status.lastError}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, phaseStatus === "IN_PROGRESS" && { opacity: 0.5 }]}
          onPress={onStart}
          disabled={kicking || phaseStatus === "IN_PROGRESS"}
        >
          <Text style={styles.btnText}>
            {kicking ? "..." :
             phaseStatus === "DONE" ? "Re-run" :
             phaseStatus === "IN_PROGRESS" ? "Running" :
             phaseStatus === "FAILED" ? "Retry" : "Start"}
          </Text>
        </Pressable>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  cardDesc: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  progressOuter: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 6,
  },
  progressInner: { height: 6, borderRadius: 3 },
  metaText: { color: colors.muted, fontSize: 11, fontFamily: "Menlo" },
  actions: { flexDirection: "row", marginTop: 10 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  btnText: { color: "#0a0a0c", fontWeight: "700", fontSize: 12 },
});
