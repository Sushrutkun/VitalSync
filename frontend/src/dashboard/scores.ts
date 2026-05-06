import type { DailySummary } from "@/src/types/api";

export type Score = {
  /** 0..100 */
  value: number;
  /** 0..1 for ring fill */
  ratio: number;
  label: string;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function recoveryScore(s: Pick<DailySummary, "restingHeartRateBpm" | "sleepDurationMinutes">): Score {
  const rhr = s.restingHeartRateBpm ?? 0;
  const sleepMin = s.sleepDurationMinutes ?? 0;

  const rhrScore = rhr > 0 ? clamp(((80 - rhr) / 40) * 100, 0, 100) : 50;
  const sleepScore = clamp((sleepMin / 480) * 100, 0, 100);
  const value = Math.round(0.6 * rhrScore + 0.4 * sleepScore);

  return { value, ratio: value / 100, label: "Recovery" };
}

export function strainScore(s: Pick<DailySummary, "activeCaloriesKcal" | "avgHeartRateBpm">): Score {
  const kcal = s.activeCaloriesKcal ?? 0;
  const avgHr = s.avgHeartRateBpm ?? 0;

  const kcalScore = clamp((kcal / 600) * 100, 0, 100);
  const hrScore = avgHr > 0 ? clamp(((avgHr - 60) / 80) * 100, 0, 100) : 0;
  const value = Math.round(0.7 * kcalScore + 0.3 * hrScore);

  return { value, ratio: value / 100, label: "Strain" };
}

export function sleepScore(s: Pick<DailySummary, "sleepDurationMinutes">): Score {
  const sleepMin = s.sleepDurationMinutes ?? 0;
  const value = Math.round(clamp((sleepMin / 480) * 100, 0, 100));
  return { value, ratio: value / 100, label: "Sleep" };
}

export function formatSleep(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
