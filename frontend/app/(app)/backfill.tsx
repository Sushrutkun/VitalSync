import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import { syncWindow } from "@/src/health/sync";

const DAY_MS = 24 * 60 * 60 * 1000;

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

type DayStatus = "pending" | "running" | "ok" | "error";

type DayResult = {
  label: string;
  status: DayStatus;
  error?: string;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function BackfillScreen() {
  const router = useRouter();
  const [days, setDays] = useState(10);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DayResult[]>([]);
  const [done, setDone] = useState(false);

  function buildDayWindows(n: number): { start: Date; end: Date; label: string }[] {
    const windows = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const day = new Date(now.getTime() - i * DAY_MS);
      windows.push({
        start: startOfLocalDay(day),
        end: i === 0 ? now : endOfLocalDay(day),
        label: fmtDate(startOfLocalDay(day)),
      });
    }
    return windows;
  }

  async function runBackfill() {
    const windows = buildDayWindows(days);
    const initial: DayResult[] = windows.map((w) => ({ label: w.label, status: "pending" }));
    setResults(initial);
    setRunning(true);
    setDone(false);

    const updated = [...initial];
    for (let i = 0; i < windows.length; i++) {
      updated[i] = { ...updated[i], status: "running" };
      setResults([...updated]);

      const result = await syncWindow(windows[i].start, windows[i].end);

      if (result.ok) {
        updated[i] = { ...updated[i], status: "ok" };
      } else {
        const msg =
          result.reason === "error" && result.error instanceof Error
            ? result.error.message
            : result.reason;
        updated[i] = { ...updated[i], status: "error", error: msg };
      }
      setResults([...updated]);
    }

    setRunning(false);
    setDone(true);
  }

  const succeeded = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;
  const total = results.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Health Backfill</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>
        {!running && !done ? (
          <View style={styles.card}>
            <Text style={styles.label}>Days to backfill</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setDays((d) => Math.max(1, d - 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.daysValue}>{days}</Text>
              <Pressable
                onPress={() => setDays((d) => Math.min(30, d + 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Sends one sync per day from {fmtDate(startOfLocalDay(new Date(Date.now() - (days - 1) * DAY_MS)))} → today.
              Backend deduplicates repeated runs.
            </Text>
            <Pressable style={styles.startBtn} onPress={() => void runBackfill()}>
              <Text style={styles.startText}>Start Backfill</Text>
            </Pressable>
          </View>
        ) : null}

        {results.length > 0 ? (
          <>
            {(running || done) ? (
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  {running
                    ? `Syncing… ${results.filter((r) => r.status === "ok" || r.status === "error").length}/${total}`
                    : `Done — ${succeeded} ok, ${failed} failed`}
                </Text>
                {done ? (
                  <Pressable
                    style={styles.retryBtn}
                    onPress={() => { setResults([]); setDone(false); }}
                  >
                    <Text style={styles.retryText}>Reset</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {results.map((r, i) => (
              <View
                key={i}
                style={[styles.dayRow, { borderLeftColor: statusColor(r.status) }]}
              >
                <Text style={styles.dayLabel}>{r.label}</Text>
                <View style={styles.dayRight}>
                  {r.status === "running" ? (
                    <Text style={[styles.dayStatus, { color: colors.warn }]}>syncing…</Text>
                  ) : r.status === "ok" ? (
                    <Text style={[styles.dayStatus, { color: colors.ok }]}>✓</Text>
                  ) : r.status === "error" ? (
                    <Text style={[styles.dayStatus, { color: colors.err }]}>✗ {r.error}</Text>
                  ) : (
                    <Text style={[styles.dayStatus, { color: colors.muted }]}>pending</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function statusColor(s: DayStatus): string {
  if (s === "ok") return colors.ok;
  if (s === "error") return colors.err;
  if (s === "running") return colors.warn;
  return colors.border;
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
    gap: 16,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 24 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.text, fontSize: 22, fontWeight: "600" },
  daysValue: { color: colors.accent, fontSize: 32, fontWeight: "700", minWidth: 50, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  startText: { color: "#0a0a0c", fontWeight: "700", fontSize: 15 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryText: { color: colors.muted, fontSize: 12 },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  dayLabel: { color: colors.text, fontSize: 13, fontFamily: "Menlo" },
  dayRight: { flex: 1, alignItems: "flex-end" },
  dayStatus: { fontSize: 12, fontFamily: "Menlo", textAlign: "right", flexShrink: 1 },
});
