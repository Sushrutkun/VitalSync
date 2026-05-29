import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { XStack, YStack, Text } from "tamagui";

import { healthApi } from "@/src/api/health";
import { Body, Card, Heading, Ring } from "@/src/components/ui";
import { ApiError } from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";
import type { AnalyticsResponse } from "@/src/types/api";

type Range = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

const RANGES: { key: Range; label: string }[] = [
  { key: "HOUR", label: "1H" },
  { key: "DAY", label: "1D" },
  { key: "WEEK", label: "1W" },
  { key: "MONTH", label: "1M" },
  { key: "YEAR", label: "1Y" },
];

const METRIC_META: Record<string, { label: string; unit: string; color: string }> = {
  steps: { label: "Steps", unit: "steps", color: brand.accent },
  distance: { label: "Distance", unit: "km", color: brand.accent },
  calories: { label: "Calories", unit: "kcal", color: brand.strain },
  avgHr: { label: "Avg Heart Rate", unit: "bpm", color: brand.coral },
  restingHr: { label: "Resting HR", unit: "bpm", color: brand.recovery },
  spo2: { label: "Blood Oxygen", unit: "%", color: brand.sleep },
  sleep: { label: "Sleep", unit: "min", color: brand.violet },
  hrZone: { label: "Zone Minutes", unit: "min", color: brand.strain },
};

const BAR_MAX_HEIGHT = 120;

const METRIC_MAX: Record<string, number> = {
  steps: 20000,
  distance: 10000,
  calories: 1000,
  avgHr: 200,
  restingHr: 200,
  spo2: 100,
  sleep: 480,
  hrZone: 60,
};

export default function AnalyticsScreen() {
  const { metric } = useLocalSearchParams<{ metric: string }>();
  const router = useRouter();
  const [range, setRange] = useState<Range>("DAY");

  const meta = METRIC_META[metric ?? "steps"] ?? { label: metric ?? "Metric", unit: "", color: brand.accent };

  const query = useQuery({
    queryKey: ["analytics", metric, range],
    queryFn: () => healthApi.analytics(metric ?? "steps", range),
    enabled: !!metric,
    retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2,
  });

  const data: AnalyticsResponse | undefined = query.data;
  const latest = data?.stats.latest ?? null;
  const maxVal = data ? Math.max(...data.points.map((p) => p.value), 1) : 1;

  function formatValue(v: number | null): string {
    if (v === null) return "—";
    if (metric === "distance") return (v / 1000).toFixed(2);
    if (metric === "steps") return Math.round(v).toLocaleString();
    return Math.round(v).toString();
  }

  function ringValue(v: number | null): string {
    if (v === null) return "—";
    if (metric === "steps") {
      if (v >= 10000) return `${Math.round(v / 1000)}k`;
      if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
      return Math.round(v).toString();
    }
    if (metric === "distance") return `${(v / 1000).toFixed(1)}`;
    return Math.round(v).toString();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 28 }}
      >
        {/* Header */}
        <XStack alignItems="center" gap={12}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={22} color={brand.dark.muted} />
          </Pressable>
          <Heading level={2}>{meta.label}</Heading>
        </XStack>

        {/* Hero ring */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <YStack alignItems="center" paddingVertical={8}>
            {query.isLoading ? (
              <YStack width={180} height={180} alignItems="center" justifyContent="center">
                <ActivityIndicator color={meta.color} size="large" />
              </YStack>
            ) : (
              <Ring
                progress={Math.max(
                  0,
                  Math.min(1, (latest ?? 0) / (METRIC_MAX[metric ?? "steps"] ?? 100)),
                )}
                color={meta.color}
                size={180}
                strokeWidth={12}
                value={ringValue(latest)}
                unit={meta.unit}
                label=""
                delay={200}
              />
            )}
          </YStack>
        </Animated.View>

        {/* Range tabs */}
        <XStack justifyContent="center" gap={4}>
          {RANGES.map((r) => (
            <Pressable key={r.key} onPress={() => setRange(r.key)} hitSlop={8}>
              <YStack
                paddingHorizontal={14}
                paddingVertical={8}
                borderRadius={999}
                backgroundColor={(range === r.key ? `${meta.color}22` : "transparent") as any}
                borderWidth={1}
                borderColor={(range === r.key ? meta.color : "transparent") as any}
              >
                <Body
                  size="sm"
                  weight={range === r.key ? "semibold" : "regular"}
                  style={{ color: range === r.key ? meta.color : brand.dark.muted }}
                >
                  {r.label}
                </Body>
              </YStack>
            </Pressable>
          ))}
        </XStack>

        {/* Bar chart */}
        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <Card padding={20}>
            {query.isLoading ? (
              <YStack alignItems="center" padding={20}>
                <ActivityIndicator color={meta.color} />
              </YStack>
            ) : data && data.points.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: "flex-end", minWidth: "100%" }}
              >
                {data.points.map((pt, i) => {
                  const barH = Math.max(4, (pt.value / maxVal) * BAR_MAX_HEIGHT);
                  return (
                    <YStack key={i} alignItems="center" gap={4} width={20}>
                      <YStack
                        width={12}
                        height={barH}
                        borderRadius={4}
                        backgroundColor={meta.color as any}
                        opacity={0.85}
                      />
                    </YStack>
                  );
                })}
              </ScrollView>
            ) : (
              <YStack alignItems="center" padding={20}>
                <Body tone="muted">No data for this range</Body>
              </YStack>
            )}
          </Card>
        </Animated.View>

        {/* Stats row */}
        {data?.stats ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <XStack gap={10}>
              <StatCard label="Avg" value={formatValue(data.stats.avg)} unit={meta.unit} color={meta.color} />
              <StatCard label="Min" value={formatValue(data.stats.min)} unit={meta.unit} color={meta.color} />
              <StatCard label="Max" value={formatValue(data.stats.max)} unit={meta.unit} color={meta.color} />
              <StatCard label="Latest" value={formatValue(data.stats.latest)} unit={meta.unit} color={meta.color} />
            </XStack>
          </Animated.View>
        ) : null}

        {query.error && !(query.error instanceof ApiError && query.error.status === 404) ? (
          <Card padding={16}>
            <Body tone="danger">
              {query.error instanceof ApiError ? query.error.message : "Could not load data."}
            </Body>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <Card flex={1} padding={12} gap={4} alignItems="center">
      <Body tone="muted" size="xs" eyebrow>
        {label}
      </Body>
      <Text fontFamily="$heading" fontSize={20} lineHeight={24} style={{ color }}>
        {value}
      </Text>
      {unit ? (
        <Body tone="muted" size="xs">
          {unit}
        </Body>
      ) : null}
    </Card>
  );
}
