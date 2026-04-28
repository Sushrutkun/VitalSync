import { useInfiniteQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { healthApi } from "@/src/api/health";
import { ApiError } from "@/src/lib/api";
import type { HealthSnapshot } from "@/src/types/api";

const PAGE_SIZE = 50;

export default function HistoryScreen() {
  const to = new Date();
  const from = subDays(to, 7);

  const query = useInfiniteQuery({
    queryKey: ["history", from.toISOString(), to.toISOString()],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      healthApi.history({
        from: from.toISOString(),
        to: to.toISOString(),
        limit: PAGE_SIZE,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const snapshots = query.data?.pages.flatMap((p) => p.snapshots) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.heading}>History</Text>
        <Text style={styles.subheading}>Last 7 days</Text>
      </View>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : query.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>
            {query.error instanceof ApiError ? query.error.message : "Could not load history."}
          </Text>
          <Pressable style={styles.retry} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={snapshots}
          keyExtractor={(item, idx) => `${item.timestamp}-${idx}`}
          renderItem={({ item }) => <SnapshotRow snapshot={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No snapshots in range.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SnapshotRow({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTime}>{format(new Date(snapshot.timestamp), "MMM d HH:mm")}</Text>
      <View style={styles.rowMetrics}>
        {snapshot.heartRateBpm != null && (
          <Metric label="HR" value={`${snapshot.heartRateBpm}`} />
        )}
        {snapshot.stepsDelta != null && <Metric label="+steps" value={`${snapshot.stepsDelta}`} />}
        {snapshot.bloodOxygenPct != null && (
          <Metric label="SpO₂" value={`${snapshot.bloodOxygenPct}%`} />
        )}
        {snapshot.activeCaloriesKcal != null && (
          <Metric label="kcal" value={snapshot.activeCaloriesKcal.toFixed(1)} />
        )}
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f8" },
  header: { padding: 20, paddingBottom: 8 },
  heading: { fontSize: 28, fontWeight: "700" },
  subheading: { fontSize: 14, color: "#666", marginTop: 2 },
  center: { padding: 40, alignItems: "center" },
  error: { color: "#d33", marginBottom: 12 },
  retry: {
    backgroundColor: "#0a7",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16, gap: 8 },
  footer: { padding: 16 },
  emptyText: { color: "#666" },
  row: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rowTime: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  rowMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  metricLabel: { fontSize: 12, color: "#888" },
  metricValue: { fontSize: 14, fontWeight: "600", color: "#111" },
});
