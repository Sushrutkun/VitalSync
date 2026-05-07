import { readRecords } from "react-native-health-connect";

import type { ExerciseSession, HealthSnapshot } from "../types/api";
import { exerciseTypeName } from "./exerciseTypes";

const HR_ZONE_MIN_BPM = 120;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function diffMinutes(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
}

async function readHeartRateAvg(periodStart: string, periodEnd: string): Promise<number | null> {
  const { records } = await readRecords("HeartRate", {
    timeRangeFilter: { operator: "between", startTime: periodStart, endTime: periodEnd },
  });
  let sum = 0;
  let n = 0;
  for (const rec of records) {
    for (const sample of rec.samples ?? []) {
      const t = new Date(sample.time).getTime();
      if (t >= new Date(periodStart).getTime() && t <= new Date(periodEnd).getTime()) {
        sum += sample.beatsPerMinute;
        n += 1;
      }
    }
  }
  return n > 0 ? Math.round(sum / n) : null;
}

async function readHeartRateZoneMinutes(
  periodStart: string,
  periodEnd: string,
): Promise<number | null> {
  const { records } = await readRecords("HeartRate", {
    timeRangeFilter: { operator: "between", startTime: periodStart, endTime: periodEnd },
  });
  const samples: { t: number; bpm: number }[] = [];
  const startMs = new Date(periodStart).getTime();
  const endMs = new Date(periodEnd).getTime();
  for (const rec of records) {
    for (const s of rec.samples ?? []) {
      const t = new Date(s.time).getTime();
      if (t >= startMs && t <= endMs) samples.push({ t, bpm: s.beatsPerMinute });
    }
  }
  if (samples.length === 0) return null;
  samples.sort((a, b) => a.t - b.t);
  let zoneMs = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1];
    const cur = samples[i];
    const gap = cur.t - prev.t;
    if (gap <= 0 || gap > 5 * 60_000) continue;
    if (prev.bpm >= HR_ZONE_MIN_BPM && cur.bpm >= HR_ZONE_MIN_BPM) zoneMs += gap;
  }
  return Math.round(zoneMs / 60_000);
}

async function readStepsSum(startTime: string, endTime: string): Promise<number> {
  const { records } = await readRecords("Steps", {
    timeRangeFilter: { operator: "between", startTime, endTime },
  });
  return records.reduce((acc, r) => acc + (r.count ?? 0), 0);
}

async function readDistanceMeters(startTime: string, endTime: string): Promise<number | null> {
  const { records } = await readRecords("Distance", {
    timeRangeFilter: { operator: "between", startTime, endTime },
  });
  if (records.length === 0) return null;
  const total = records.reduce((acc, r) => acc + (r.distance?.inMeters ?? 0), 0);
  return Math.round(total);
}

async function readLatestSpO2(periodStart: string, periodEnd: string): Promise<number | null> {
  const { records } = await readRecords("OxygenSaturation", {
    timeRangeFilter: { operator: "between", startTime: periodStart, endTime: periodEnd },
  });
  if (records.length === 0) return null;
  const sorted = [...records].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
  const pct = sorted[0]?.percentage;
  return typeof pct === "number" ? Math.round(pct * 10) / 10 : null;
}

async function readActiveCalories(periodStart: string, periodEnd: string): Promise<number | null> {
  const { records } = await readRecords("ActiveCaloriesBurned", {
    timeRangeFilter: { operator: "between", startTime: periodStart, endTime: periodEnd },
  });
  if (records.length === 0) return null;
  const total = records.reduce((acc, r) => acc + (r.energy?.inKilocalories ?? 0), 0);
  return Math.round(total * 100) / 100;
}

async function readExerciseSessions(
  periodStart: string,
  periodEnd: string,
): Promise<ExerciseSession[]> {
  const { records } = await readRecords("ExerciseSession", {
    timeRangeFilter: { operator: "between", startTime: periodStart, endTime: periodEnd },
  });
  return records.map<ExerciseSession>((r) => ({
    type: exerciseTypeName(r.exerciseType),
    startTime: r.startTime,
    endTime: r.endTime,
    durationMinutes: diffMinutes(r.startTime, r.endTime),
  }));
}

export async function buildSnapshotForWindow(
  periodStart: Date,
  periodEnd: Date,
): Promise<HealthSnapshot> {
  const startIso = periodStart.toISOString();
  const endIso = periodEnd.toISOString();
  const dayStartIso = startOfUtcDay(periodEnd).toISOString();

  const [
    heartRateBpm,
    stepsDelta,
    stepsTotal,
    bloodOxygenPct,
    activeCaloriesKcal,
    distanceMeters,
    heartRateZoneMinutes,
    exerciseSessions,
  ] = await Promise.all([
    readHeartRateAvg(startIso, endIso),
    readStepsSum(startIso, endIso),
    readStepsSum(dayStartIso, endIso),
    readLatestSpO2(startIso, endIso),
    readActiveCalories(startIso, endIso),
    readDistanceMeters(dayStartIso, endIso),
    readHeartRateZoneMinutes(dayStartIso, endIso),
    readExerciseSessions(startIso, endIso),
  ]);

  return {
    timestamp: endIso,
    periodStart: startIso,
    periodEnd: endIso,
    heartRateBpm,
    stepsTotal: stepsTotal > 0 ? stepsTotal : null,
    stepsDelta: stepsDelta > 0 ? stepsDelta : null,
    bloodOxygenPct,
    activeCaloriesKcal,
    distanceMeters,
    heartRateZoneMinutes,
    exerciseSessions,
  };
}
