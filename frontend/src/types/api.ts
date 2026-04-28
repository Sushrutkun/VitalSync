export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "REFRESH_TOKEN_EXPIRED"
  | "REFRESH_TOKEN_INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type ExerciseSession = {
  type: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  calories?: number;
  distanceMeters?: number;
  avgHeartRateBpm?: number;
};

export type HealthSnapshot = {
  timestamp: string;
  periodStart: string;
  periodEnd: string;
  heartRateBpm: number | null;
  stepsTotal: number | null;
  stepsDelta: number | null;
  bloodOxygenPct: number | null;
  activeCaloriesKcal: number | null;
  exerciseSessions: ExerciseSession[];
};

export type HealthSyncRequest = {
  userId: string;
  idempotencyKey: string;
  periodStart: string;
  periodEnd: string;
  snapshot: HealthSnapshot;
};

export type HealthSyncResponse = {
  received: boolean;
  duplicate: boolean;
};

export type DailySummary = {
  date: string;
  steps: number;
  activeCaloriesKcal: number;
  avgHeartRateBpm: number;
  restingHeartRateBpm: number;
  bloodOxygenPct: number;
  sleepDurationMinutes: number;
  exerciseSessions: ExerciseSession[];
};

export type HistoryQuery = {
  from: string;
  to: string;
  types?: string;
  limit?: number;
  cursor?: string;
};

export type HistoryResponse = {
  snapshots: HealthSnapshot[];
  nextCursor: string | null;
  total: number;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  createdAt: string;
};

export type UpdateProfileRequest = {
  name?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
};
