import type { HealthSnapshot } from "../types/api";

export async function buildSnapshotForWindow(start: Date, end: Date): Promise<HealthSnapshot> {
  return {
    timestamp: new Date().toISOString(),
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    heartRateBpm: null,
    stepsTotal: null,
    stepsDelta: null,
    bloodOxygenPct: null,
    activeCaloriesKcal: null,
    exerciseSessions: [],
  };
}
