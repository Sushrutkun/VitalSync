import * as Crypto from "expo-crypto";

import { healthApi } from "../api/health";
import { checkpointStorage, tokenStorage } from "../lib/storage";
import type { HealthSnapshot, HealthSyncResponse } from "../types/api";
import { hasHealthPermissions } from "./permissions";
import { buildSnapshotForWindow } from "./snapshot";

export type SyncResult =
  | { ok: true; result: HealthSyncResponse; snapshot: HealthSnapshot }
  | { ok: false; reason: "unauthenticated" | "no-permission" | "error"; error?: unknown };

const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export async function syncFromCheckpoint(): Promise<SyncResult> {
  const userId = await tokenStorage.getUserId();
  if (!userId) return { ok: false, reason: "unauthenticated" };

  const granted = await hasHealthPermissions();
  if (!granted) return { ok: false, reason: "no-permission" };

  const periodEnd = new Date();
  const savedTs = await checkpointStorage.getLastSnapshotTimestamp();
  const periodStart = savedTs
    ? new Date(savedTs)
    : new Date(periodEnd.getTime() - DEFAULT_LOOKBACK_MS);

  const snapshot = await buildSnapshotForWindow(periodStart, periodEnd);

  try {
    const result = await healthApi.sync({
      userId,
      idempotencyKey: Crypto.randomUUID(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      snapshot,
    });
    await checkpointStorage.setLastSnapshotTimestamp(periodEnd.toISOString());
    return { ok: true, result, snapshot };
  } catch (error) {
    return { ok: false, reason: "error", error };
  }
}

// Sync an explicit window without touching the checkpoint — used for backfill.
export async function syncWindow(periodStart: Date, periodEnd: Date): Promise<SyncResult> {
  const userId = await tokenStorage.getUserId();
  if (!userId) return { ok: false, reason: "unauthenticated" };

  const granted = await hasHealthPermissions();
  if (!granted) return { ok: false, reason: "no-permission" };

  const snapshot = await buildSnapshotForWindow(periodStart, periodEnd);

  try {
    const result = await healthApi.sync({
      userId,
      idempotencyKey: Crypto.randomUUID(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      snapshot,
    });
    return { ok: true, result, snapshot };
  } catch (error) {
    return { ok: false, reason: "error", error };
  }
}
