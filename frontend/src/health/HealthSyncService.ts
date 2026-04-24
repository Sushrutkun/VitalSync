import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { HealthRepository } from './HealthRepository';
import { HealthApi } from '../api/HealthApi';

const LAST_SYNCED_KEY = '@vitalsync/lastSyncedAt';
const POLL_INTERVAL_MS = 60_000;

// Fallback: if app has never synced, read the last 24 hours
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;

async function getLastSyncedAt(): Promise<Date> {
  const stored = await AsyncStorage.getItem(LAST_SYNCED_KEY);
  return stored ? new Date(stored) : new Date(Date.now() - DEFAULT_LOOKBACK_MS);
}

async function setLastSyncedAt(date: Date): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNCED_KEY, date.toISOString());
}

async function syncOnce(): Promise<void> {
  const since = await getLastSyncedAt();
  const until = new Date();

  // Skip if the window is less than 10 seconds — avoids duplicate micro-syncs
  if (until.getTime() - since.getTime() < 10_000) return;

  const snapshot = await HealthRepository.readSnapshot(since, until);

  // userId resolved from stored token claims — placeholder until auth context wired in
  const userId = 'me';

  await HealthApi.sendHealthSnapshot({
    userId,
    idempotencyKey: uuidv4(),
    periodStart: since.toISOString(),
    periodEnd: until.toISOString(),
    snapshot,
  });

  await setLastSyncedAt(until);
}

export const HealthSyncService = {
  // Called when app comes to foreground: catch up missed data first, then start polling
  async catchUpSync(): Promise<void> {
    try {
      await syncOnce();
    } catch (e) {
      console.warn('[HealthSync] catch-up sync failed:', e);
    }
  },

  start(): void {
    if (intervalId !== null) return;
    intervalId = setInterval(async () => {
      try {
        await syncOnce();
      } catch (e) {
        console.warn('[HealthSync] foreground sync failed:', e);
      }
    }, POLL_INTERVAL_MS);
  },

  stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },
};
