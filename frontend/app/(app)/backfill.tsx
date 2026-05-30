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

type Mode = "quick" | "range";
type DayStatus = "pending" | "running" | "ok" | "error";
type DayResult = { label: string; status: DayStatus; error?: string };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

type DateState = { year: number; month: number; day: number };

function toDate(s: DateState): Date {
  return new Date(s.year, s.month, s.day);
}

function SpinField({
  label,
  value,
  onDec,
  onInc,
  display,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  display: string;
}) {
  return (
    <View style={styles.spinField}>
      <Text style={styles.spinLabel}>{label}</Text>
      <Pressable onPress={onInc} style={styles.spinArrow}>
        <Text style={styles.spinArrowText}>▲</Text>
      </Pressable>
      <Text style={styles.spinValue}>{display}</Text>
      <Pressable onPress={onDec} style={styles.spinArrow}>
        <Text style={styles.spinArrowText}>▼</Text>
      </Pressable>
    </View>
  );
}

function DatePicker({
  label,
  value,
  onChange,
  maxDate,
}: {
  label: string;
  value: DateState;
  onChange: (v: DateState) => void;
  maxDate?: Date;
}) {
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear();

  function setYear(y: number) {
    const d = clampDay(y, value.month, value.day);
    onChange({ ...value, year: y, day: d });
  }
  function setMonth(m: number) {
    const d = clampDay(value.year, m, value.day);
    onChange({ ...value, month: m, day: d });
  }
  function setDay(d: number) {
    onChange({ ...value, day: d });
  }

  const maxDay = daysInMonth(value.year, value.month);

  return (
    <View style={styles.datePickerBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.datePickerRow}>
        <SpinField
          label="Day"
          value={value.day}
          display={String(value.day).padStart(2, "0")}
          onDec={() => setDay(value.day <= 1 ? maxDay : value.day - 1)}
          onInc={() => setDay(value.day >= maxDay ? 1 : value.day + 1)}
        />
        <SpinField
          label="Month"
          value={value.month}
          display={MONTHS[value.month]}
          onDec={() => setMonth(value.month <= 0 ? 11 : value.month - 1)}
          onInc={() => setMonth(value.month >= 11 ? 0 : value.month + 1)}
        />
        <SpinField
          label="Year"
          value={value.year}
          display={String(value.year)}
          onDec={() => setYear(value.year - 1)}
          onInc={() => setYear(Math.min(maxYear, value.year + 1))}
        />
      </View>
    </View>
  );
}

function buildWindows(from: Date, to: Date): { start: Date; end: Date; label: string }[] {
  const windows: { start: Date; end: Date; label: string }[] = [];
  const fromDay = startOfLocalDay(from);
  const toDay = startOfLocalDay(to);
  let cursor = new Date(fromDay);
  while (cursor <= toDay) {
    const isLast = cursor.toDateString() === toDay.toDateString();
    windows.push({
      start: startOfLocalDay(cursor),
      end: isLast ? to : endOfLocalDay(cursor),
      label: fmtDate(cursor),
    });
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  return windows;
}

export default function BackfillScreen() {
  const router = useRouter();
  const now = new Date();

  const [mode, setMode] = useState<Mode>("quick");
  const [quickDays, setQuickDays] = useState(10);

  const [startDate, setStartDate] = useState<DateState>({
    year: now.getFullYear(),
    month: now.getMonth(),
    day: Math.max(1, now.getDate() - 9),
  });
  const [endDate, setEndDate] = useState<DateState>({
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
  });

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DayResult[]>([]);
  const [done, setDone] = useState(false);

  function getWindows() {
    if (mode === "quick") {
      const windows: { start: Date; end: Date; label: string }[] = [];
      for (let i = quickDays - 1; i >= 0; i--) {
        const day = new Date(now.getTime() - i * DAY_MS);
        windows.push({
          start: startOfLocalDay(day),
          end: i === 0 ? now : endOfLocalDay(day),
          label: fmtDate(startOfLocalDay(day)),
        });
      }
      return windows;
    }
    const from = toDate(startDate);
    const to = endOfLocalDay(toDate(endDate));
    return buildWindows(from, to);
  }

  function rangeValid(): boolean {
    return toDate(startDate) <= toDate(endDate);
  }

  async function runBackfill() {
    const windows = getWindows();
    if (windows.length === 0) return;
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
  const isInvalid = mode === "range" && !rangeValid();
  const previewWindows = !running && !done ? getWindows() : [];

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
          <>
            {/* Mode toggle */}
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, mode === "quick" && styles.modeBtnActive]}
                onPress={() => setMode("quick")}
              >
                <Text style={[styles.modeBtnText, mode === "quick" && styles.modeBtnTextActive]}>
                  Last N days
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, mode === "range" && styles.modeBtnActive]}
                onPress={() => setMode("range")}
              >
                <Text style={[styles.modeBtnText, mode === "range" && styles.modeBtnTextActive]}>
                  Date range
                </Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              {mode === "quick" ? (
                <>
                  <Text style={styles.label}>Days to backfill</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => setQuickDays((d) => Math.max(1, d - 1))}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>−</Text>
                    </Pressable>
                    <Text style={styles.daysValue}>{quickDays}</Text>
                    <Pressable
                      onPress={() => setQuickDays((d) => Math.min(365, d + 1))}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.hint}>
                    {fmtDate(startOfLocalDay(new Date(now.getTime() - (quickDays - 1) * DAY_MS)))} → today · {quickDays} day{quickDays !== 1 ? "s" : ""}
                  </Text>
                </>
              ) : (
                <>
                  <DatePicker
                    label="Start date"
                    value={startDate}
                    onChange={setStartDate}
                    maxDate={now}
                  />
                  <View style={styles.divider} />
                  <DatePicker
                    label="End date"
                    value={endDate}
                    onChange={setEndDate}
                    maxDate={now}
                  />
                  {isInvalid ? (
                    <Text style={styles.errText}>Start date must be before end date</Text>
                  ) : (
                    <Text style={styles.hint}>
                      {previewWindows.length} day{previewWindows.length !== 1 ? "s" : ""} selected
                    </Text>
                  )}
                </>
              )}

              <Pressable
                style={[styles.startBtn, isInvalid && styles.startBtnDisabled]}
                onPress={() => { if (!isInvalid) void runBackfill(); }}
              >
                <Text style={styles.startText}>Start Backfill</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {results.length > 0 ? (
          <>
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
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  modeBtnActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(108,240,194,0.08)",
  },
  modeBtnText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  modeBtnTextActive: { color: colors.accent },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
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
  daysValue: { color: colors.accent, fontSize: 36, fontWeight: "700", minWidth: 60, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  errText: { color: colors.err, fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.border },
  datePickerBlock: { gap: 10 },
  datePickerRow: { flexDirection: "row", gap: 8 },
  spinField: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  spinLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  spinArrow: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  spinArrowText: { color: colors.accent, fontSize: 14 },
  spinValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Menlo",
    minWidth: 48,
    textAlign: "center",
    backgroundColor: colors.bg,
    borderRadius: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  startBtnDisabled: { opacity: 0.4 },
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
  },
  dayLabel: { color: colors.text, fontSize: 13, fontFamily: "Menlo" },
  dayRight: { flex: 1, alignItems: "flex-end" },
  dayStatus: { fontSize: 12, fontFamily: "Menlo", textAlign: "right", flexShrink: 1 },
});
