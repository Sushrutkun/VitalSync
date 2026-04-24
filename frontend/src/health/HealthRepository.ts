import {
  initialize,
  requestPermission,
  readRecords,
  aggregateRecord,
  RecordType,
} from 'react-native-health-connect';
import { HealthSnapshot, ExerciseSession } from '../types/health';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'HeartRate' as RecordType },
  { accessType: 'read', recordType: 'Steps' as RecordType },
  { accessType: 'read', recordType: 'OxygenSaturation' as RecordType },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' as RecordType },
  { accessType: 'read', recordType: 'ExerciseSession' as RecordType },
];

export const HealthRepository = {
  async initialize(): Promise<boolean> {
    return initialize();
  },

  async requestPermissions(): Promise<void> {
    await requestPermission(PERMISSIONS);
  },

  async readSnapshot(since: Date, until: Date): Promise<HealthSnapshot> {
    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: since.toISOString(),
      endTime: until.toISOString(),
    };

    const [heartRateAgg, stepsAgg, caloriesAgg, oxygenRecords, exerciseRecords] =
      await Promise.all([
        aggregateRecord({ recordType: 'HeartRate', timeRangeFilter }).catch(() => null),
        aggregateRecord({ recordType: 'Steps', timeRangeFilter }).catch(() => null),
        aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }).catch(() => null),
        readRecords('OxygenSaturation', { timeRangeFilter }).catch(() => ({ records: [] })),
        readRecords('ExerciseSession', { timeRangeFilter }).catch(() => ({ records: [] })),
      ]);

    // Latest SpO2 reading in the window
    const latestOxygen =
      oxygenRecords.records.length > 0
        ? (oxygenRecords.records[oxygenRecords.records.length - 1] as any)
            ?.percentage?.value ?? null
        : null;

    const sessions: ExerciseSession[] = exerciseRecords.records.map((r: any) => ({
      type: r.exerciseType ?? 'UNKNOWN',
      startTime: r.startTime,
      endTime: r.endTime,
      durationMinutes: Math.round(
        (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000,
      ),
      calories: r.energy?.inKilocalories ?? undefined,
      distanceMeters: r.distance?.inMeters ?? undefined,
    }));

    return {
      timestamp: until.toISOString(),
      periodStart: since.toISOString(),
      periodEnd: until.toISOString(),
      heartRateBpm: (heartRateAgg as any)?.AVG?.beatsPerMinute ?? null,
      stepsTotal: (stepsAgg as any)?.COUNT_TOTAL ?? null,
      stepsDelta: (stepsAgg as any)?.COUNT_TOTAL ?? null,
      bloodOxygenPct: latestOxygen,
      activeCaloriesKcal: (caloriesAgg as any)?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? null,
      exerciseSessions: sessions,
    };
  },
};
