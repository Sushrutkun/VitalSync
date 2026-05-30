import * as Crypto from "expo-crypto";

import Gadgetbridge, { type GadgetbridgeSample } from "@/modules/gadgetbridge";
import { healthApi } from "../api/health";
import { tokenStorage } from "../lib/storage";
import type { HealthSnapshot } from "../types/api";

const FLUSH_INTERVAL_MS = 15 * 60_000;

type WindowAccumulator = {
  start: Date;
  hrSamples: number[];
  stepsLatest: number | null;
};

let acc: WindowAccumulator | null = null;
let sub: { remove: () => void } | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function newWindow(): WindowAccumulator {
  return { start: new Date(), hrSamples: [], stepsLatest: null };
}

function ingest(sample: GadgetbridgeSample): void {
  if (!acc) acc = newWindow();
  if (sample.heartRateBpm != null) acc.hrSamples.push(sample.heartRateBpm);
  if (sample.steps != null) acc.stepsLatest = sample.steps;
}

async function flush(): Promise<void> {
  if (!acc) return;
  const window = acc;
  acc = newWindow();

  const periodEnd = new Date();
  const hr = window.hrSamples.length > 0
    ? window.hrSamples.reduce((a, b) => a + b, 0) / window.hrSamples.length
    : null;

  if (hr == null && window.stepsLatest == null) return;

  const snapshot: HealthSnapshot = {
    timestamp: periodEnd.toISOString(),
    periodStart: window.start.toISOString(),
    periodEnd: periodEnd.toISOString(),
    heartRateBpm: hr != null ? Math.round(hr) : null,
    stepsTotal: window.stepsLatest,
    stepsDelta: null,
    bloodOxygenPct: null,
    activeCaloriesKcal: null,
    distanceMeters: null,
    heartRateZoneMinutes: null,
    exerciseSessions: [],
  };

  const userId = await tokenStorage.getUserId();
  if (!userId) return;

  try {
    await healthApi.sync({
      userId,
      idempotencyKey: Crypto.randomUUID(),
      source: "GADGETBRIDGE",
      periodStart: window.start.toISOString(),
      periodEnd: periodEnd.toISOString(),
      snapshot,
    });
  } catch (e) {
    // Silently swallow — next window will retry with fresh data
  }
}

export async function startGadgetbridge(): Promise<boolean> {
  if (sub) return true;
  const installed = await Gadgetbridge.isInstalled();
  if (!installed) return false;
  await Gadgetbridge.start();
  acc = newWindow();
  sub = Gadgetbridge.onSample(ingest);
  flushTimer = setInterval(() => { void flush(); }, FLUSH_INTERVAL_MS);
  return true;
}

export async function stopGadgetbridge(): Promise<void> {
  if (sub) { sub.remove(); sub = null; }
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  await Gadgetbridge.stop();
  await flush();
  acc = null;
}

export async function isGadgetbridgeInstalled(): Promise<boolean> {
  return Gadgetbridge.isInstalled();
}
