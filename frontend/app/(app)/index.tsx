import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { healthApi } from "@/src/api/health";
import { usersApi } from "@/src/api/users";
import { Body, Button, Card, Heading, Ring, RowItem } from "@/src/components/ui";
import { recoveryScore, sleepScore, strainScore } from "@/src/dashboard/scores";
import {
  ensureHealthPermissions,
  getHealthConnectStatus,
  openHealthConnectAppSettings,
} from "@/src/health/permissions";
import { syncFromCheckpoint } from "@/src/health/sync";
import { ApiError } from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";

function todayUtc(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function firstName(name: string | undefined): string {
  if (!name) return "V";
  return name.trim().split(/\s+/)[0] ?? "V";
}

function vitalsInRange(data: {
  steps?: number | null;
  avgHeartRateBpm?: number | null;
  bloodOxygenPct?: number | null;
  sleepDurationMinutes?: number | null;
  activeCaloriesKcal?: number | null;
}): { count: number; total: number } {
  const checks = [
    data.steps,
    data.avgHeartRateBpm,
    data.bloodOxygenPct,
    data.sleepDurationMinutes,
    data.activeCaloriesKcal,
  ];
  return { count: checks.filter((v) => v != null && (v as number) > 0).length, total: 5 };
}

function hrStatus(rhr: number | null | undefined): "Normal" | "Elevated" | "—" {
  if (!rhr) return "—";
  return rhr < 80 ? "Normal" : "Elevated";
}

export default function TodayScreen() {
  const { width: screenWidth } = useWindowDimensions();
  // 20px padding each side + 2×8px gap between 3 tiles
  const tileSize = Math.floor((screenWidth - 40 - 16) / 3);
  const ringSize = tileSize;
  const date = todayUtc();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);

  const summary = useQuery({
    queryKey: ["summary", date],
    queryFn: () => healthApi.summary(date),
    retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2,
  });

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.me(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    void (async () => {
      const status = await getHealthConnectStatus();
      if (status !== "available") return;
      const perm = await ensureHealthPermissions();
      if (!perm.granted) return;
      await syncFromCheckpoint();
      void summary.refetch();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setNeedsSettings(false);
    const status = await getHealthConnectStatus();
    if (status !== "available") {
      setSyncMessage(
        status === "provider-update-required"
          ? "Update Health Connect from the Play Store."
          : "Health Connect is not available on this device.",
      );
      setSyncing(false);
      return;
    }
    const perm = await ensureHealthPermissions();
    if (!perm.granted) {
      const names = perm.missing.map((p) => p.recordType).join(", ");
      setSyncMessage(`Missing permissions: ${names}.`);
      setNeedsSettings(true);
      setSyncing(false);
      return;
    }
    const result = await syncFromCheckpoint();
    setSyncMessage(result.ok ? "Synced." : `Sync failed: ${result.reason}`);
    void summary.refetch();
    setSyncing(false);
  };

  const onRefresh = async () => {
    setSyncing(true);
    const status = await getHealthConnectStatus();
    if (status === "available") {
      const perm = await ensureHealthPermissions();
      if (perm.granted) await syncFromCheckpoint();
    }
    void summary.refetch();
    setSyncing(false);
  };

  const isNotFound = summary.error instanceof ApiError && summary.error.status === 404;
  const data = summary.data;
  const recovery = data ? recoveryScore(data) : null;
  const strain = data ? strainScore(data) : null;
  const sleep = data ? sleepScore(data) : null;
  const vr = data ? vitalsInRange(data) : null;
  const rhrStatus = data ? hrStatus(data.restingHeartRateBpm) : "—";
  const initials = firstName(profile.data?.name)[0]?.toUpperCase() ?? "V";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={summary.isFetching || syncing}
            onRefresh={onRefresh}
            tintColor={brand.accent}
          />
        }
      >
        {/* TOP BAR */}
        <XStack alignItems="center" justifyContent="space-between">
          {/* Left pill: avatar + flame + strain */}
          <Pressable
            onPress={() => router.push("/profile" as any)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <XStack
              alignItems="center"
              gap={6}
              paddingHorizontal={10}
              paddingVertical={6}
              borderRadius={999}
              backgroundColor="rgba(255,255,255,0.06)"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.08)"
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: brand.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text fontFamily="$body" fontWeight="700" fontSize={12} color="#0B1426">
                  {initials}
                </Text>
              </View>
              <Ionicons name="flame" size={14} color={brand.strain} />
              <Text fontFamily="$heading" fontSize={14} color={brand.strain as any}>
                {strain ? `${strain.value}` : "—"}
              </Text>
            </XStack>
          </Pressable>

          {/* Center pill: date nav */}
          <XStack
            alignItems="center"
            gap={8}
            paddingHorizontal={14}
            paddingVertical={8}
            borderRadius={999}
            backgroundColor="rgba(255,255,255,0.06)"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.08)"
          >
            <Ionicons name="chevron-back" size={14} color={brand.dark.muted} />
            <Body weight="semibold" letterSpacing={0.5} size="sm">
              Today
            </Body>
            <Ionicons name="chevron-forward" size={14} color={brand.dark.muted} />
          </XStack>

          {/* Right: watch icon */}
          <Pressable
            onPress={() => router.push("/devices" as any)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <XStack
              alignItems="center"
              gap={6}
              paddingHorizontal={10}
              paddingVertical={6}
              borderRadius={999}
              backgroundColor="rgba(255,255,255,0.06)"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.08)"
            >
              {syncing ? (
                <ActivityIndicator size="small" color={brand.accent} />
              ) : (
                <>
                  <Ionicons name="watch-outline" size={16} color={brand.dark.muted} />
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: "#4ADE80",
                      marginLeft: -2,
                      marginTop: -8,
                    }}
                  />
                </>
              )}
            </XStack>
          </Pressable>
        </XStack>

        {/* Sync banner */}
        {syncMessage ? (
          <YStack gap={6}>
            <Body tone="muted" size="sm">
              {syncMessage}
            </Body>
            {needsSettings ? (
              <Button onPress={openHealthConnectAppSettings} intent="secondary" size="sm">
                Open Health Connect settings
              </Button>
            ) : null}
          </YStack>
        ) : null}

        {/* States */}
        {summary.isLoading ? (
          <Card padding={24} alignItems="center">
            <ActivityIndicator color={brand.accent} />
          </Card>
        ) : isNotFound ? (
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Card elevated padding={28} alignItems="center" gap={10}>
              <Ionicons name="moon-outline" size={28} color={brand.violet} />
              <Body weight="semibold" size="xl">
                Nothing tracked yet today.
              </Body>
              <Body tone="muted" textAlign="center">
                Pull down to sync.
              </Body>
            </Card>
          </Animated.View>
        ) : summary.error ? (
          <Card padding={20}>
            <Body tone="danger">
              {summary.error instanceof ApiError
                ? summary.error.message
                : "Could not load summary."}
            </Body>
          </Card>
        ) : data && recovery && strain && sleep ? (
          <>
            {/* 3 RINGS */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <XStack gap={8} justifyContent="space-between">
                {([
                  { label: "Sleep", color: brand.strain, progress: sleep.ratio, value: `${sleep.value}%`, delay: 200, route: "/analytics/sleep" },
                  { label: "Recovery", color: brand.accent, progress: recovery.ratio, value: `${recovery.value}%`, delay: 300, route: "/analytics/avgHr" },
                  { label: "Strain", color: brand.sleep, progress: Math.min(strain.value / 21, 1), value: `${strain.value}`, delay: 400, route: "/analytics/hrZone" },
                ] as const).map((item) => (
                  <Pressable key={item.label} onPress={() => router.push(item.route as any)}>
                    <YStack alignItems="center" gap={10}>
                      <Ring
                        size={ringSize}
                        strokeWidth={Math.round(ringSize * 0.1)}
                        progress={item.progress}
                        color={item.color}
                        label=""
                        value={item.value}
                        delay={item.delay}
                      />
                      <Body weight="semibold" size="sm" style={{ color: brand.dark.text }}>
                        {item.label} ›
                      </Body>
                    </YStack>
                  </Pressable>
                ))}
              </XStack>
            </Animated.View>

            {/* 2-COL SUMMARY CARDS */}
            <Animated.View entering={FadeInDown.delay(180).duration(500)}>
              <XStack gap={10}>
                <Pressable style={{ flex: 1 }} onPress={() => router.push("/analytics/steps" as any)}>
                  <Card flex={1} padding={14} gap={4}>
                    <XStack alignItems="center" gap={6}>
                      <Ionicons
                        name={
                          vr && vr.count === vr.total
                            ? "checkmark-circle"
                            : "checkmark-circle-outline"
                        }
                        size={15}
                        color={vr && vr.count === vr.total ? brand.accent : brand.dark.muted}
                      />
                      <Body size="sm" weight="semibold">
                        Within range
                      </Body>
                    </XStack>
                    <Text fontFamily="$heading" fontSize={24} color={brand.accent as any}>
                      {vr ? `${vr.count}/${vr.total}` : "—"}
                    </Text>
                    <Body tone="muted" size="xs" eyebrow>
                      Health monitor
                    </Body>
                  </Card>
                </Pressable>

                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => router.push("/analytics/restingHr" as any)}
                >
                  <Card flex={1} padding={14} gap={4}>
                    <XStack alignItems="center" gap={6}>
                      <Ionicons name="heart-outline" size={15} color={brand.coral} />
                      <Body size="sm" weight="semibold">
                        Resting HR
                      </Body>
                    </XStack>
                    <Text fontFamily="$heading" fontSize={24} color={brand.coral as any}>
                      {data.restingHeartRateBpm ? Math.round(data.restingHeartRateBpm) : "—"}
                    </Text>
                    <XStack alignItems="center" gap={4}>
                      <Body tone="muted" size="xs">
                        bpm
                      </Body>
                      {rhrStatus !== "—" ? (
                        <Body
                          size="xs"
                          style={{
                            color:
                              rhrStatus === "Normal" ? brand.accent : brand.strain,
                          }}
                        >
                          {rhrStatus}
                        </Body>
                      ) : null}
                    </XStack>
                  </Card>
                </Pressable>
              </XStack>
            </Animated.View>

            {/* 2-COL METRIC TILES */}
            <Animated.View entering={FadeInDown.delay(240).duration(500)}>
              <XStack gap={10}>
                <MetricTile
                  value={data.steps != null ? data.steps.toLocaleString() : "—"}
                  label="Steps"
                  icon={<Ionicons name="walk-outline" size={15} color={brand.dark.muted} />}
                  onPress={() => router.push("/analytics/steps" as any)}
                />
                <MetricTile
                  value={
                    data.avgHeartRateBpm != null ? `${Math.round(data.avgHeartRateBpm)}` : "—"
                  }
                  unit="bpm"
                  label="Heart rate"
                  icon={<Ionicons name="heart-outline" size={15} color={brand.dark.muted} />}
                  onPress={() => router.push("/analytics/avgHr" as any)}
                />
              </XStack>
            </Animated.View>

            {/* MY DAY */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <YStack gap={12}>
                <XStack alignItems="center" justifyContent="space-between">
                  <Heading level={2}>My Day</Heading>
                  <Pressable
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: brand.dark.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={18} color={brand.dark.text as any} />
                  </Pressable>
                </XStack>

                <RowItem
                  title="Your day in review"
                  trailing={
                    <Ionicons name="chevron-forward" size={16} color={brand.dark.muted} />
                  }
                />

                <YStack gap={8}>
                  <XStack alignItems="center" justifyContent="space-between">
                    <Body tone="muted" size="xs" eyebrow>
                      Today&apos;s activities
                    </Body>
                    <Pressable onPress={onSyncNow} hitSlop={8}>
                      <Ionicons name="refresh-outline" size={14} color={brand.dark.muted} />
                    </Pressable>
                  </XStack>

                  {data.exerciseSessions && data.exerciseSessions.length > 0 ? (
                    data.exerciseSessions.map((s, i) => (
                      <RowItem
                        key={`${s.startTime}-${i}`}
                        title={s.type}
                        subtitle={`${Math.round(s.durationMinutes)} min · ${format(new Date(s.startTime), "HH:mm")}`}
                        leading={
                          <Ionicons name="fitness-outline" size={18} color={brand.strain} />
                        }
                        leadingTint={brand.strain}
                        trailing={
                          s.calories != null ? (
                            <Body weight="semibold" editorial tone="default" size="lg">
                              {Math.round(s.calories)}
                              <Body tone="muted" size="sm" letterSpacing={0.8}>
                                {" "}
                                kcal
                              </Body>
                            </Body>
                          ) : null
                        }
                      />
                    ))
                  ) : (
                    <YStack gap={12} paddingVertical={8}>
                      <Body tone="muted" textAlign="center">
                        No activities yet
                      </Body>
                      <XStack gap={10}>
                        <View style={{ flex: 1 }}>
                          <Button intent="ghost" size="sm">
                            + Add Activity
                          </Button>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button intent="secondary" size="sm">
                            Start Activity
                          </Button>
                        </View>
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Animated.View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({
  value,
  unit,
  label,
  icon,
  onPress,
}: {
  value: string;
  unit?: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <Card flex={1} padding={16} gap={4}>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <XStack alignItems="baseline" gap={4}>
            <Text fontFamily="$heading" fontSize={28} color={brand.dark.text as any}>
              {value}
            </Text>
            {unit ? (
              <Body tone="muted" size="sm">
                {unit}
              </Body>
            ) : null}
          </XStack>
          <Ionicons name="chevron-forward" size={16} color={brand.dark.muted} />
        </XStack>
        <XStack alignItems="center" gap={6} marginTop={6}>
          {icon}
          <Body tone="muted" size="sm">
            {label}
          </Body>
        </XStack>
      </Card>
    </Pressable>
  );
}
