import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import { useAuth } from "../auth/AuthContext";
import { env } from "../config/env";
import { getHealthConnectStatus, getMissingHealthPermissions } from "../health/permissions";
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

const METHOD_COLORS: Record<string, string> = {
  GET: "#6cf0c2",
  POST: "#7AB6FF",
  PUT: "#f5b754",
  PATCH: "#c084fc",
  DELETE: "#ef6b6b",
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

function MethodBadge({ method }: { method?: string }) {
  const m = method ?? "?";
  return (
    <View style={[styles.methodBadge, { borderColor: METHOD_COLORS[m] ?? colors.muted }]}>
      <Text style={[styles.methodText, { color: METHOD_COLORS[m] ?? colors.muted }]}>{m}</Text>
    </View>
  );
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

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  if (data === undefined || data === null) return null;
  const text =
    typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
  return (
    <View style={styles.jsonBlock}>
      <Text style={styles.jsonLabel}>{label}</Text>
      <ScrollView horizontal style={styles.jsonScroll}>
        <Text style={styles.jsonText}>{text}</Text>
      </ScrollView>
    </View>
  );
}

function CurlBlock({ entry, baseUrl }: { entry: DebugEntry; baseUrl: string }) {
  const method = entry.method ?? "GET";
  const url = `${baseUrl}${entry.path ?? ""}`;
  const lines: string[] = [`curl -X ${method} '${url}'`];
  if (entry.requestHeaders) {
    for (const [k, v] of Object.entries(entry.requestHeaders)) {
      lines.push(`  -H '${k}: ${v}'`);
    }
  }
  if (entry.requestBody !== undefined) {
    lines.push(`  -d '${JSON.stringify(entry.requestBody)}'`);
  }
  const curlText = lines.join(" \\\n");
  return (
    <View style={styles.jsonBlock}>
      <Text style={styles.jsonLabel}>CURL</Text>
      <ScrollView horizontal style={styles.jsonScroll}>
        <Text style={styles.jsonText}>{curlText}</Text>
      </ScrollView>
    </View>
  );
}

function DetailView({ entry, onBack }: { entry: DebugEntry; onBack: () => void }) {
  const statusColor = kindColor(entry.kind, entry.status);
  const hasQuery =
    entry.queryParams && Object.keys(entry.queryParams).length > 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.detailTitle} numberOfLines={1}>
          {entry.path ?? entry.title}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Method + Status row */}
        <View style={styles.detailTopRow}>
          <MethodBadge method={entry.method} />
          {entry.status != null ? (
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {entry.status}
              </Text>
            </View>
          ) : null}
          {entry.durationMs != null ? (
            <Text style={styles.durationText}>{entry.durationMs}ms</Text>
          ) : null}
          <Text style={styles.timestampText}>{fmtTime(entry.ts)}</Text>
        </View>

        {/* URL */}
        <View style={styles.urlBlock}>
          <Text style={styles.jsonLabel}>URL</Text>
          <ScrollView horizontal>
            <Text style={styles.urlText}>
              {env.apiBaseUrl}{entry.path ?? ""}
            </Text>
          </ScrollView>
        </View>

        {/* Query params */}
        {hasQuery ? (
          <JsonBlock label="QUERY PARAMS" data={entry.queryParams} />
        ) : null}

        {/* Request headers */}
        {entry.requestHeaders && Object.keys(entry.requestHeaders).length > 0 ? (
          <JsonBlock label="REQUEST HEADERS" data={entry.requestHeaders} />
        ) : null}

        {/* curl */}
        <CurlBlock entry={entry} baseUrl={env.apiBaseUrl} />

        {/* Request body */}
        {entry.requestBody !== undefined ? (
          <JsonBlock label="REQUEST BODY" data={entry.requestBody} />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No request body</Text>
          </View>
        )}

        {/* Error detail */}
        {entry.detail ? (
          <View style={styles.jsonBlock}>
            <Text style={[styles.jsonLabel, { color: colors.err }]}>ERROR</Text>
            <Text style={[styles.jsonText, { color: colors.err }]}>{entry.detail}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [selected, setSelected] = useState<DebugEntry | null>(null);
  const [hcStatus, setHcStatus] = useState<string>("checking…");
  const [hcGranted, setHcGranted] = useState<boolean | null>(null);
  const [hcMissing, setHcMissing] = useState<string[]>([]);
  const { userId, isReady, logout } = useAuth();
  const router = useRouter();

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
        const missing = await getMissingHealthPermissions();
        if (alive) {
          setHcGranted(missing.length === 0);
          setHcMissing(missing.map((p) => p.recordType));
        }
      } catch {
        if (alive) {
          setHcGranted(false);
          setHcMissing([]);
        }
      }
    })();
    return () => { alive = false; };
  }, [open]);

  const errorCount = entries.filter(
    (e) => e.kind === "error" || (e.status && e.status >= 400),
  ).length;

  function handleClose() {
    setOpen(false);
    setSelected(null);
  }

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

      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.modal}>
          {selected ? (
            <DetailView entry={selected} onBack={() => setSelected(null)} />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Debug</Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
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
                  {userId ? (
                    <Pressable
                      onPress={() => { void logout(); handleClose(); }}
                      style={styles.logoutBtn}
                    >
                      <Text style={styles.logoutText}>Force Logout</Text>
                    </Pressable>
                  ) : null}
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
                  {hcMissing.length > 0 ? (
                    <StatusRow label="HC missing" value={hcMissing.join(", ")} valueColor={colors.err} />
                  ) : null}
                </View>

                <View style={styles.sectionRow}>
                  <Text style={styles.section}>Tools</Text>
                </View>
                <View style={styles.card}>
                  <Pressable
                    style={styles.toolBtn}
                    onPress={() => { handleClose(); router.push("/backfill" as any); }}
                  >
                    <Text style={styles.toolBtnText}>Health Backfill →</Text>
                    <Text style={styles.toolBtnHint}>Bulk-sync past days to backend</Text>
                  </Pressable>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                  <Pressable
                    style={styles.toolBtn}
                    onPress={() => { handleClose(); router.push("/sources" as any); }}
                  >
                    <Text style={styles.toolBtnText}>Data Sources →</Text>
                    <Text style={styles.toolBtnHint}>Connect Fitbit, Strava, WHOOP, Health Connect</Text>
                  </Pressable>
                </View>

                <View style={styles.sectionRow}>
                  <Text style={styles.section}>API calls ({entries.length})</Text>
                  <Pressable
                    onPress={() => debugLog.clear()}
                    style={styles.clearBtn}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                </View>

                {entries.length === 0 ? (
                  <Text style={styles.empty}>No calls yet.</Text>
                ) : (
                  entries.map((e) => (
                    <Pressable
                      key={e.id}
                      onPress={() => setSelected(e)}
                      style={({ pressed }) => [
                        styles.entry,
                        { borderLeftColor: kindColor(e.kind, e.status) },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.entryHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                          <MethodBadge method={e.method} />
                          <Text
                            style={[styles.entryTitle, { color: kindColor(e.kind, e.status) }]}
                            numberOfLines={1}
                          >
                            {e.path ?? e.title}
                          </Text>
                        </View>
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
                        <Text style={[styles.entryDuration, { marginLeft: "auto" }]}>tap for details ›</Text>
                      </View>
                      {e.detail ? <Text style={styles.entryDetail}>{e.detail}</Text> : null}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </>
          )}
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
  entryMeta: { flexDirection: "row", gap: 12, marginTop: 4, alignItems: "center" },
  entryStatus: { fontSize: 11, fontWeight: "700", fontFamily: "Menlo" },
  entryDuration: { color: colors.muted, fontSize: 11, fontFamily: "Menlo" },
  entryDetail: { color: colors.muted, fontSize: 11, marginTop: 6, fontFamily: "Menlo" },
  // Detail view
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: colors.accent, fontWeight: "600", fontSize: 15 },
  detailTitle: { color: colors.text, fontSize: 14, fontWeight: "600", flex: 1, fontFamily: "Menlo" },
  detailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
    flexWrap: "wrap",
  },
  methodBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  methodText: { fontSize: 11, fontWeight: "700", fontFamily: "Menlo" },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700", fontFamily: "Menlo" },
  durationText: { color: colors.muted, fontSize: 12, fontFamily: "Menlo" },
  timestampText: { color: colors.muted, fontSize: 12, fontFamily: "Menlo", marginLeft: "auto" },
  urlBlock: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlText: { color: colors.text, fontSize: 12, fontFamily: "Menlo" },
  jsonBlock: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jsonLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 8, letterSpacing: 1 },
  jsonScroll: { maxHeight: 300 },
  jsonText: { color: colors.text, fontSize: 12, fontFamily: "Menlo" },
  emptySection: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptySectionText: { color: colors.muted, fontSize: 12 },
  logoutBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.err,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logoutText: { color: colors.err, fontSize: 12, fontWeight: "700" },
  toolBtn: {
    gap: 2,
  },
  toolBtnText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  toolBtnHint: { color: colors.muted, fontSize: 11 },
});
