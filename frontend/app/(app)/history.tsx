import { useInfiniteQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, XStack, YStack, Text } from "tamagui";

import { healthApi } from "@/src/api/health";
import { Body, Button, Card, Heading } from "@/src/components/ui";
import { ApiError } from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";
import type { HealthSnapshot } from "@/src/types/api";

const PAGE_SIZE = 50;

type Bucket = {
  dayKey: string;
  date: Date;
  items: HealthSnapshot[];
};

function bucketByDay(snapshots: HealthSnapshot[]): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const s of snapshots) {
    const d = new Date(s.timestamp);
    const key = format(d, "yyyy-MM-dd");
    if (!map.has(key)) {
      map.set(key, {
        dayKey: key,
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        items: [],
      });
    }
    map.get(key)!.items.push(s);
  }
  return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

function summarize(items: HealthSnapshot[]) {
  let steps = 0;
  let kcal = 0;
  let hrSum = 0;
  let hrN = 0;
  let spoSum = 0;
  let spoN = 0;
  for (const s of items) {
    if (s.stepsDelta != null) steps += s.stepsDelta;
    if (s.activeCaloriesKcal != null) kcal += s.activeCaloriesKcal;
    if (s.heartRateBpm != null) {
      hrSum += s.heartRateBpm;
      hrN += 1;
    }
    if (s.bloodOxygenPct != null) {
      spoSum += s.bloodOxygenPct;
      spoN += 1;
    }
  }
  return {
    steps,
    kcal: Math.round(kcal),
    avgHr: hrN > 0 ? Math.round(hrSum / hrN) : null,
    avgSpo: spoN > 0 ? Math.round(spoSum / spoN) : null,
    samples: items.length,
  };
}

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

  const buckets = useMemo(
    () => bucketByDay(query.data?.pages.flatMap((p) => p.snapshots) ?? []),
    [query.data],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <YStack padding={24} paddingBottom={4} gap={6}>
        <Body tone="muted" eyebrow>
          Last 7 days
        </Body>
        <Heading level={1}>History.</Heading>
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
          data={buckets}
          keyExtractor={(b) => b.dayKey}
          renderItem={({ item, index }) => (
            <TimelineRow bucket={item} isFirst={index === 0} isLast={index === buckets.length - 1} />
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 }}
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

function TimelineRow({
  bucket,
  isFirst,
  isLast,
}: {
  bucket: Bucket;
  isFirst: boolean;
  isLast: boolean;
}) {
  const s = summarize(bucket.items);
  const dayNum = format(bucket.date, "dd");
  const dayWord = format(bucket.date, "EEE");

  return (
    <XStack gap={16} alignItems="stretch" paddingVertical={6}>
      {/* Date column + timeline rail */}
      <YStack width={62} alignItems="flex-end" position="relative">
        <Text
          fontFamily="$heading"
          fontStyle="italic"
          fontSize={36}
          lineHeight={40}
          color={brand.accent as any}
        >
          {dayNum}
        </Text>
        <Body tone="muted" eyebrow letterSpacing={2}>
          {dayWord}
        </Body>
        {/* Rail dot */}
        <View
          style={{
            position: "absolute",
            right: -8,
            top: 14,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: brand.accent,
            shadowColor: brand.accent,
            shadowOpacity: 0.7,
            shadowRadius: 6,
          }}
        />
        {/* Rail line */}
        {!isLast ? (
          <View
            style={{
              position: "absolute",
              right: -4,
              top: 28,
              bottom: -28,
              width: 1,
              backgroundColor: "rgba(124,247,176,0.25)",
            }}
          />
        ) : null}
        {isFirst ? null : null}
      </YStack>

      <YStack flex={1} paddingBottom={12}>
        <Card padding={16} gap={10}>
          <XStack alignItems="baseline" justifyContent="space-between">
            <Body tone="muted" eyebrow>
              {s.samples} {s.samples === 1 ? "sample" : "samples"}
            </Body>
            <Body tone="muted" size="xs">
              {format(bucket.date, "MMM yyyy")}
            </Body>
          </XStack>
          <XStack flexWrap="wrap" gap={16}>
            <Stat label="Steps" value={s.steps.toLocaleString()} accent={brand.accent} />
            <Stat label="Kcal" value={`${s.kcal}`} accent={brand.strain} />
            {s.avgHr != null ? (
              <Stat label="Avg HR" value={`${s.avgHr}`} unit="bpm" accent={brand.coral} />
            ) : null}
            {s.avgSpo != null ? (
              <Stat label="SpO₂" value={`${s.avgSpo}%`} accent={brand.sleep} />
            ) : null}
          </XStack>
        </Card>
      </YStack>
    </XStack>
  );
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}) {
  return (
    <YStack gap={2}>
      <Body tone="muted" eyebrow>
        {label}
      </Body>
      <XStack alignItems="baseline" gap={3}>
        <Text
          fontFamily="$heading"
          fontStyle="italic"
          fontSize={22}
          lineHeight={26}
          color={(accent ?? brand.dark.text) as any}
        >
          {value}
        </Text>
        {unit ? (
          <Body tone="muted" size="xs">
            {unit}
          </Body>
        ) : null}
      </XStack>
    </YStack>
  );
}
