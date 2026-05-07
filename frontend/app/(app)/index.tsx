import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { healthApi } from "@/src/api/health";
import { Body, Button, Card, Heading, MetricCard, Ring, RowItem, ThemeToggle } from "@/src/components/ui";
import { formatSleep, recoveryScore, sleepScore, strainScore } from "@/src/dashboard/scores";
import { ensureHealthPermissions, getHealthConnectStatus } from "@/src/health/permissions";
import { syncLastMinute } from "@/src/health/sync";
import { ApiError } from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";

function todayUtc(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export default function TodayScreen() {
  const date = todayUtc();
  const theme = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ["summary", date],
    queryFn: () => healthApi.summary(date),
    retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2,
  });

  const onSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
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
      setSyncMessage("Health Connect permissions were not granted.");
      setSyncing(false);
      return;
    }
    const result = await syncLastMinute();
    setSyncMessage(result.ok ? "Synced last minute." : `Sync failed: ${result.reason}`);
    void summary.refetch();
    setSyncing(false);
  };

  const isNotFound = summary.error instanceof ApiError && summary.error.status === 404;
  const data = summary.data;

  const recovery = data ? recoveryScore(data) : null;
  const strain = data ? strainScore(data) : null;
  const sleep = data ? sleepScore(data) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={summary.isFetching}
            onRefresh={() => summary.refetch()}
            tintColor={theme.accent?.val}
          />
        }
      >
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <Body tone="muted" size="sm" weight="semibold">
              {format(new Date(), "EEEE, d MMM").toUpperCase()}
            </Body>
            <Heading level={1}>Today</Heading>
          </YStack>
          <ThemeToggle />
        </XStack>

        {summary.isLoading ? (
          <Card padding={24} alignItems="center">
            <Body tone="muted">Loading…</Body>
          </Card>
        ) : isNotFound ? (
          <Card elevated padding={24} alignItems="center" gap={6}>
            <Body weight="semibold" size="lg">
              No data yet for today.
            </Body>
            <Body tone="muted" textAlign="center">
              Tap &quot;Sync now&quot; to upload your latest readings.
            </Body>
          </Card>
        ) : summary.error ? (
          <Card padding={20}>
            <Body tone="danger">
              {summary.error instanceof ApiError ? summary.error.message : "Could not load summary."}
            </Body>
          </Card>
        ) : data && recovery && strain && sleep ? (
          <>
            <YStack gap={10}>
              <Body tone="muted" size="sm" weight="semibold">
                TODAY
              </Body>
              <XStack gap={10} flexWrap="wrap">
                <MetricCard
                  large
                  label="Steps"
                  value={data.steps?.toLocaleString() ?? "—"}
                  icon={<Ionicons name="walk-outline" size={20} color={brand.accent} />}
                />
                <MetricCard
                  large
                  label="Distance"
                  value={
                    data.distanceMeters != null
                      ? (data.distanceMeters / 1000).toFixed(2)
                      : "—"
                  }
                  unit="km"
                  icon={<Ionicons name="map-outline" size={20} color={brand.accent} />}
                />
                <MetricCard
                  large
                  label="Calories"
                  value={
                    data.activeCaloriesKcal != null
                      ? Math.round(data.activeCaloriesKcal).toString()
                      : "—"
                  }
                  unit="kcal"
                  accent="$strain"
                  icon={<Ionicons name="flame-outline" size={20} color={brand.strain} />}
                />
                <MetricCard
                  large
                  label="Zone min"
                  value={
                    data.heartRateZoneMinutes != null
                      ? data.heartRateZoneMinutes.toString()
                      : "—"
                  }
                  unit="min"
                  accent="$strain"
                  icon={<Ionicons name="stopwatch-outline" size={20} color={brand.strain} />}
                />
              </XStack>
            </YStack>

            <Card elevated padding={20} gap={16}>
              <Body tone="muted" size="sm" weight="semibold">
                DAILY SCORES
              </Body>
              <XStack justifyContent="space-around" alignItems="center" flexWrap="wrap" gap={12}>
                <Ring
                  progress={recovery.ratio}
                  color={brand.recovery}
                  label={recovery.label}
                  value={`${recovery.value}`}
                  unit="%"
                />
                <Ring
                  progress={strain.ratio}
                  color={brand.strain}
                  label={strain.label}
                  value={`${strain.value}`}
                  unit="%"
                />
                <Ring
                  progress={sleep.ratio}
                  color={brand.sleep}
                  label={sleep.label}
                  value={`${sleep.value}`}
                  unit="%"
                />
              </XStack>
            </Card>

            <YStack gap={10}>
              <Body tone="muted" size="sm" weight="semibold">
                VITALS
              </Body>
              <XStack gap={10} flexWrap="wrap">
                <MetricCard
                  label="Steps"
                  value={data.steps?.toLocaleString() ?? "—"}
                  icon={<Ionicons name="walk-outline" size={18} color={brand.accent} />}
                />
                <MetricCard
                  label="Active kcal"
                  value={data.activeCaloriesKcal != null ? Math.round(data.activeCaloriesKcal).toString() : "—"}
                  unit="kcal"
                  accent="$strain"
                  icon={<Ionicons name="flame-outline" size={18} color={brand.strain} />}
                />
                <MetricCard
                  label="Avg HR"
                  value={data.avgHeartRateBpm != null ? `${data.avgHeartRateBpm}` : "—"}
                  unit="bpm"
                  icon={<Ionicons name="heart-outline" size={18} color={brand.danger} />}
                />
                <MetricCard
                  label="Resting HR"
                  value={data.restingHeartRateBpm != null ? `${data.restingHeartRateBpm}` : "—"}
                  unit="bpm"
                  accent="$recovery"
                  icon={<Ionicons name="pulse-outline" size={18} color={brand.recovery} />}
                />
                <MetricCard
                  label="SpO₂"
                  value={data.bloodOxygenPct != null ? `${data.bloodOxygenPct}` : "—"}
                  unit="%"
                  icon={<Ionicons name="water-outline" size={18} color={brand.sleep} />}
                />
                <MetricCard
                  label="Sleep"
                  value={formatSleep(data.sleepDurationMinutes)}
                  accent="$sleep"
                  icon={<Ionicons name="moon-outline" size={18} color={brand.sleep} />}
                />
              </XStack>
            </YStack>

            {data.exerciseSessions && data.exerciseSessions.length > 0 ? (
              <YStack gap={10}>
                <Body tone="muted" size="sm" weight="semibold">
                  RECENT ACTIVITY
                </Body>
                <YStack gap={8}>
                  {data.exerciseSessions.map((s, i) => (
                    <RowItem
                      key={`${s.startTime}-${i}`}
                      title={s.type}
                      subtitle={`${Math.round(s.durationMinutes)} min · ${format(new Date(s.startTime), "HH:mm")}`}
                      leading={<Ionicons name="fitness-outline" size={20} color={brand.strain} />}
                      trailing={
                        s.calories != null ? (
                          <Body weight="semibold">{Math.round(s.calories)} kcal</Body>
                        ) : null
                      }
                    />
                  ))}
                </YStack>
              </YStack>
            ) : null}
          </>
        ) : null}

        <Button onPress={onSyncNow} loading={syncing} marginTop="$2">
          Sync now
        </Button>
        {syncMessage ? (
          <Body tone="muted" textAlign="center" size="sm">
            {syncMessage}
          </Body>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
