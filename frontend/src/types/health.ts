export interface ExerciseSession {
  type: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  calories?: number;
  distanceMeters?: number;
  avgHeartRateBpm?: number;
}

export interface HealthSnapshot {
  timestamp: string;
  periodStart: string;
  periodEnd: string;
  heartRateBpm: number | null;
  stepsTotal: number | null;
  stepsDelta: number | null;
  bloodOxygenPct: number | null;
  activeCaloriesKcal: number | null;
  exerciseSessions: ExerciseSession[];
}

export interface BatchHealthRequest {
  userId: string;
  idempotencyKey: string;
  periodStart: string;
  periodEnd: string;
  snapshot: HealthSnapshot;
}
