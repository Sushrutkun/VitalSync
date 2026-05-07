import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { env } from "../config/env";
import { getHealthConnectStatus, hasHealthPermissions } from "../health/permissions";
import { debugLog, type DebugEntry } from "../lib/debugLog";

const colors = {
  bg: "rgba(10,10,12,0.96)",
  card: "#1a1d22",
  border: "#2a2f36",
  text: "#e8eaed",
  muted: "#8a929e",
  ok: "#69d4a8",
  warn: "#f5b754",
  err: "#ef6b6b",
  accent: "#6cf0c2",
};

function kindColor(kind: DebugEntry["kind"], status?: number): string {
  if (kind === "error") return colors.err;
  if (status && status >= 400) return colors.err;
  if (status && status >= 300) return colors.warn;
  if (kind === "api") return colors.ok;
  return colors.muted;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function StatusRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [hcStatus, setHcStatus] = useState<string>("checking…");
  const [hcGranted, setHcGranted] = useState<boolean | null>(null);
  const { userId, isReady } = useAuth();

  useEffect(() => debugLog.subscribe(setEntries), []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void (async () => {
      try {
        const s = await getHealthConnectStatus();
        if (alive) setHcStatus(s);
      } catch {
        if (alive) setHcStatus("error");
      }
      try {
        const g = await hasHealthPermissions();
        if (alive) setHcGranted(g);
      } catch {
        if (alive) setHcGranted(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  const errorCount = entries.filter((e) => e.kind === "error" || (e.status && e.status >= 400)).length;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.fabText}>DBG</Text>
        {errorCount > 0 ? (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{errorCount > 9 ? "9+" : errorCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Debug</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.section}>Environment</Text>
            <View style={styles.card}>
              <StatusRow label="API base" value={env.apiBaseUrl} />
              <StatusRow
                label="Auth"
                value={!isReady ? "loading" : userId ? `signed in (${userId.slice(0, 8)}…)` : "anonymous"}
                valueColor={userId ? colors.ok : colors.warn}
              />
              <StatusRow
                label="HC status"
                value={hcStatus}
                valueColor={hcStatus === "available" ? colors.ok : colors.warn}
              />
              <StatusRow
                label="HC perms"
                value={hcGranted === null ? "checking…" : hcGranted ? "granted" : "missing"}
                valueColor={hcGranted ? colors.ok : colors.err}
              />
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.section}>API calls ({entries.length})</Text>
              <Pressable onPress={() => debugLog.clear()} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            {entries.length === 0 ? (
              <Text style={styles.empty}>No calls yet.</Text>
            ) : (
              entries.map((e) => (
                <View key={e.id} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryTitle, { color: kindColor(e.kind, e.status) }]} numberOfLines={1}>
                      {e.title}
                    </Text>
                    <Text style={styles.entryTime}>{fmtTime(e.ts)}</Text>
                  </View>
                  <View style={styles.entryMeta}>
                    {e.status != null ? (
                      <Text style={[styles.entryStatus, { color: kindColor(e.kind, e.status) }]}>
                        {e.status}
                      </Text>
                    ) : null}
                    {e.durationMs != null ? (
                      <Text style={styles.entryDuration}>{e.durationMs}ms</Text>
                    ) : null}
                  </View>
                  {e.detail ? <Text style={styles.entryDetail}>{e.detail}</Text> : null}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 12,
    bottom: 80,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 9999,
  },
  fabText: { color: "#0a0a0c", fontWeight: "700", fontSize: 12 },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.err,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  fabBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  modal: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 8 },
  closeText: { color: colors.accent, fontWeight: "600" },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  section: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 16 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  clearText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, maxWidth: "60%", fontFamily: "Menlo" },
  empty: { color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: 20 },
  entry: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryTitle: { fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 },
  entryTime: { color: colors.muted, fontSize: 11, fontFamily: "Menlo" },
  entryMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  entryStatus: { fontSize: 11, fontWeight: "700", fontFamily: "Menlo" },
  entryDuration: { color: colors.muted, fontSize: 11, fontFamily: "Menlo" },
  entryDetail: { color: colors.muted, fontSize: 11, marginTop: 6, fontFamily: "Menlo" },
});
