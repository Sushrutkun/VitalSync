import * as Crypto from "expo-crypto";

import { healthApi } from "../api/health";
import { tokenStorage } from "../lib/storage";
import type { HealthSyncResponse } from "../types/api";
import { ensureHealthPermissions } from "./permissions";
import { buildSnapshotForWindow } from "./snapshot";

export type SyncResult =
  | { ok: true; result: HealthSyncResponse }
  | { ok: false; reason: "unauthenticated" | "no-permission" | "error"; error?: unknown };

export async function syncLastMinute(): Promise<SyncResult> {
  const userId = await tokenStorage.getUserId();
  if (!userId) return { ok: false, reason: "unauthenticated" };

  const perm = await ensureHealthPermissions();
  if (!perm.granted) return { ok: false, reason: "no-permission" };

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 60_000);
  const snapshot = await buildSnapshotForWindow(periodStart, periodEnd);

  try {
    const result = await healthApi.sync({
      userId,
      idempotencyKey: Crypto.randomUUID(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      snapshot,
    });
    return { ok: true, result };
  } catch (error) {
    return { ok: false, reason: "error", error };
  }
}
