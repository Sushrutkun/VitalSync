import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { healthApi } from "@/src/api/health";
import { usersApi } from "@/src/api/users";
import { Body, Button, Card, Heading, MetricCard, Ring, RowItem, ThemeToggle } from "@/src/components/ui";
import { formatSleep, recoveryScore, sleepScore, strainScore } from "@/src/dashboard/scores";
import {
  ensureHealthPermissions,
  getHealthConnectStatus,
  openHealthConnectAppSettings,
} from "@/src/health/permissions";
import { syncLastMinute } from "@/src/health/sync";
import { ApiError } from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";

function todayUtc(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function firstName(name: string | undefined): string {
  if (!name) return "friend";
  return name.trim().split(/\s+/)[0] ?? "friend";
}

function recoveryNarrative(value: number): string {
  if (value >= 75) return "your body is primed";
  if (value >= 55) return "you're recovered";
  if (value >= 35) return "moderate readiness";
  return "rest is needed";
}

export default function TodayScreen() {
  const date = todayUtc();
  const theme = useTheme();
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

  // Auto-sync on mount silently
  useEffect(() => {
    void (async () => {
      const status = await getHealthConnectStatus();
      if (status !== "available") return;
      const perm = await ensureHealthPermissions();
      if (!perm.granted) return;
      await syncLastMinute();
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
          ? "Update Health Connect from the Play Store to continue."
          : "Health Connect is not available on this device.",
      );
      setSyncing(false);
      return;
    }
    const perm = await ensureHealthPermissions();
    if (!perm.granted) {
      const names = perm.missing.map((p) => p.recordType).join(", ");
      setSyncMessage(
        `Missing Health Connect permission${perm.missing.length === 1 ? "" : "s"}: ${names}. ` +
          `Open Health Connect settings to grant access manually.`,
      );
      setNeedsSettings(true);
      setSyncing(false);
      return;
    }
    const result = await syncLastMinute();
    setSyncMessage(result.ok ? "Synced." : `Sync failed: ${result.reason}`);
    void summary.refetch();
    setSyncing(false);
  };

  const onRefresh = async () => {
    setSyncing(true);
    const status = await getHealthConnectStatus();
    if (status === "available") {
      const perm = await ensureHealthPermissions();
      if (perm.granted) await syncLastMinute();
    }
    void summary.refetch();
    setSyncing(false);
  };

  const isNotFound = summary.error instanceof ApiError && summary.error.status === 404;
  const data = summary.data;

  const recovery = data ? recoveryScore(data) : null;
  const strain = data ? strainScore(data) : null;
  const sleep = data ? sleepScore(data) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={summary.isFetching || syncing}
            onRefresh={onRefresh}
            tintColor={theme.accent?.val}
          />
        }
      >
        {/* HERO GREETING */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <XStack alignItems="flex-start" justifyContent="space-between" gap={12}>
            <YStack gap={4} flex={1}>
              <Body tone="muted" eyebrow>
                {format(new Date(), "EEEE · d MMM yyyy")}
              </Body>
              <Heading level={1}>
                {greeting()},{"\n"}
                {firstName(profile.data?.name)}.
              </Heading>
              {recovery ? (
                <Body tone="secondary" size="lg" marginTop={6}>
                  Today {recoveryNarrative(recovery.value)} —{" "}
                  <Body tone="default" weight="semibold" size="lg" editorial>
                    {recovery.value}%
                  </Body>{" "}
                  recovered.
                </Body>
              ) : null}
              {syncMessage ? (
                <Body tone="muted" size="sm" marginTop={4}>
                  {syncMessage}
                </Body>
              ) : null}
              {needsSettings ? (
                <Button onPress={openHealthConnectAppSettings} intent="secondary" size="sm" marginTop={4}>
                  Open Health Connect settings
                </Button>
              ) : null}
            </YStack>
            <XStack alignItems="center" gap={8}>
              {syncing ? (
                <ActivityIndicator size="small" color={brand.accent} />
              ) : (
                <Pressable onPress={onSyncNow} hitSlop={12} style={{ padding: 6 }}>
                  <Ionicons name="refresh-outline" size={20} color={brand.dark.muted} />
                </Pressable>
              )}
              <ThemeToggle />
            </XStack>
          </XStack>
        </Animated.View>

        {summary.isLoading ? (
          <Card padding={24} alignItems="center">
            <Body tone="muted">Loading…</Body>
          </Card>
        ) : isNotFound ? (
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Card elevated padding={28} alignItems="center" gap={10}>
              <Ionicons name="moon-outline" size={28} color={brand.violet} />
              <Body weight="semibold" size="xl">
                Nothing tracked yet today.
              </Body>
              <Body tone="muted" textAlign="center">
                Pull down to sync, or tap the refresh icon to upload your latest readings.
              </Body>
            </Card>
          </Animated.View>
        ) : summary.error ? (
          <Card padding={20}>
            <Body tone="danger">
              {summary.error instanceof ApiError ? summary.error.message : "Could not load summary."}
            </Body>
          </Card>
        ) : data && recovery && strain && sleep ? (
          <>
            {/* HERO RING */}
            <Animated.View entering={FadeInDown.delay(120).duration(600)}>
              <YStack alignItems="center" gap={20} paddingVertical={12}>
                <Ring
                  progress={recovery.ratio}
                  color={brand.recovery}
                  colorEnd={brand.violet}
                  size={240}
                  strokeWidth={14}
                  label="Recovery"
                  value={`${recovery.value}`}
                  unit="%"
                  delay={300}
                />
                <XStack gap={32} alignItems="center" justifyContent="center">
                  <Ring
                    progress={strain.ratio}
                    color={brand.strain}
                    size={96}
                    strokeWidth={8}
                    label="Strain"
                    value={`${strain.value}`}
                    delay={500}
                  />
                  <Ring
                    progress={sleep.ratio}
                    color={brand.sleep}
                    size={96}
                    strokeWidth={8}
                    label="Sleep"
                    value={`${sleep.value}`}
                    delay={600}
                  />
                </XStack>
              </YStack>
            </Animated.View>

            {/* TODAY STRIP — horizontal scroll */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <YStack gap={10}>
                <XStack alignItems="baseline" justifyContent="space-between">
                  <Heading level={2}>The day, so far</Heading>
                  <Body tone="muted" eyebrow>
                    Live
                  </Body>
                </XStack>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
                >
                  <MetricCard
                    minWidth={150}
                    label="Steps"
                    value={data.steps?.toLocaleString() ?? "—"}
                    icon={<Ionicons name="walk-outline" size={16} color={brand.accent} />}
                    pulseColor={brand.accent}
                  />
                  <MetricCard
                    minWidth={150}
                    label="Distance"
                    value={
                      data.distanceMeters != null ? (data.distanceMeters / 1000).toFixed(2) : "—"
                    }
                    unit="km"
                    icon={<Ionicons name="map-outline" size={16} color={brand.accent} />}
                  />
                  <MetricCard
                    minWidth={150}
                    label="Calories"
                    value={
                      data.activeCaloriesKcal != null
                        ? Math.round(data.activeCaloriesKcal).toString()
                        : "—"
                    }
                    unit="kcal"
                    accent={brand.strain}
                    icon={<Ionicons name="flame-outline" size={16} color={brand.strain} />}
                  />
                  <MetricCard
                    minWidth={150}
                    label="Zone min"
                    value={
                      data.heartRateZoneMinutes != null
                        ? data.heartRateZoneMinutes.toString()
                        : "—"
                    }
                    unit="min"
                    accent={brand.strain}
                    icon={<Ionicons name="stopwatch-outline" size={16} color={brand.strain} />}
                  />
                </ScrollView>
              </YStack>
            </Animated.View>

            {/* VITALS GRID — explicit 2×2 layout */}
            <Animated.View entering={FadeInDown.delay(280).duration(500)}>
              <YStack gap={10}>
                <Heading level={2}>Vitals</Heading>
                <XStack gap={10}>
                  <MetricCard
                    label="Avg HR"
                    value={data.avgHeartRateBpm != null ? `${data.avgHeartRateBpm}` : "—"}
                    unit="bpm"
                    accent={brand.coral}
                    icon={<Ionicons name="heart-outline" size={16} color={brand.coral} />}
                  />
                  <MetricCard
                    label="Resting HR"
                    value={data.restingHeartRateBpm != null ? `${data.restingHeartRateBpm}` : "—"}
                    unit="bpm"
                    accent={brand.recovery}
                    icon={<Ionicons name="pulse-outline" size={16} color={brand.recovery} />}
                  />
                </XStack>
                <XStack gap={10}>
                  <MetricCard
                    label="SpO₂"
                    value={data.bloodOxygenPct != null ? `${data.bloodOxygenPct}` : "—"}
                    unit="%"
                    accent={brand.sleep}
                    icon={<Ionicons name="water-outline" size={16} color={brand.sleep} />}
                  />
                  <MetricCard
                    label="Sleep"
                    value={formatSleep(data.sleepDurationMinutes)}
                    accent={brand.violet}
                    icon={<Ionicons name="moon-outline" size={16} color={brand.violet} />}
                  />
                </XStack>
              </YStack>
            </Animated.View>

            {/* RECENT ACTIVITY */}
            {data.exerciseSessions && data.exerciseSessions.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(360).duration(500)}>
                <YStack gap={10}>
                  <Heading level={2}>Today&apos;s movement</Heading>
                  <YStack gap={8}>
                    {data.exerciseSessions.map((s, i) => (
                      <RowItem
                        key={`${s.startTime}-${i}`}
                        title={s.type}
                        subtitle={`${Math.round(s.durationMinutes)} min · ${format(new Date(s.startTime), "HH:mm")}`}
                        leading={<Ionicons name="fitness-outline" size={18} color={brand.strain} />}
                        leadingTint={brand.strain}
                        trailing={
                          s.calories != null ? (
                            <Body weight="semibold" editorial tone="default" size="lg">
                              {Math.round(s.calories)}
                              <Body tone="muted" size="sm" letterSpacing={0.8}>
                                {" "}kcal
                              </Body>
                            </Body>
                          ) : null
                        }
                      />
                    ))}
                  </YStack>
                </YStack>
              </Animated.View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
