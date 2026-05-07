import { useInfiniteQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { healthApi } from "@/src/api/health";
import { Body, Button, Card, Heading } from "@/src/components/ui";
import { ApiError } from "@/src/lib/api";
import type { HealthSnapshot } from "@/src/types/api";

const PAGE_SIZE = 50;

export default function HistoryScreen() {
  const theme = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={["top", "bottom"]}>
      <YStack padding={20} paddingBottom={8} gap={4}>
        <Body tone="muted" size="sm" weight="semibold">
          LAST 7 DAYS
        </Body>
        <Heading level={1}>History</Heading>
      </YStack>

      {query.isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={theme.accent?.val} />
        </YStack>
      ) : query.error ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding={20} gap={12}>
          <Body tone="danger">
            {query.error instanceof ApiError ? query.error.message : "Could not load history."}
          </Body>
          <Button size="md" onPress={() => query.refetch()}>
            Retry
          </Button>
        </YStack>
      ) : (
        <FlatList
          data={snapshots}
          keyExtractor={(item, idx) => `${item.timestamp}-${idx}`}
          renderItem={({ item }) => <SnapshotRow snapshot={item} />}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={theme.accent?.val}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <YStack padding={16} alignItems="center">
                <ActivityIndicator color={theme.accent?.val} />
              </YStack>
            ) : null
          }
          ListEmptyComponent={
            <YStack padding={40} alignItems="center">
              <Body tone="muted">No snapshots in range.</Body>
            </YStack>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SnapshotRow({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <Card padding={14} gap={8} marginBottom={8}>
      <Body size="sm" weight="semibold" tone="muted">
        {format(new Date(snapshot.timestamp), "MMM d HH:mm")}
      </Body>
      <XStack flexWrap="wrap" gap={16}>
        {snapshot.heartRateBpm != null && <Metric label="HR" value={`${snapshot.heartRateBpm}`} />}
        {snapshot.stepsDelta != null && <Metric label="+steps" value={`${snapshot.stepsDelta}`} />}
        {snapshot.bloodOxygenPct != null && (
          <Metric label="SpO₂" value={`${snapshot.bloodOxygenPct}%`} />
        )}
        {snapshot.activeCaloriesKcal != null && (
          <Metric label="kcal" value={snapshot.activeCaloriesKcal.toFixed(1)} />
        )}
      </XStack>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <XStack alignItems="baseline" gap={4}>
      <Body tone="muted" size="xs">
        {label}
      </Body>
      <Body weight="semibold" size="sm">
        {value}
      </Body>
    </XStack>
  );
}
