import * as WebBrowser from "expo-web-browser";

import { sourcesApi } from "../api/sources";
import type { HealthSource } from "../types/api";

export type OAuthResult =
  | { ok: true }
  | { ok: false; reason: "cancelled" | "error"; detail?: string };

/**
 * Drives the OAuth connect flow for cloud sources (Fitbit, Strava).
 *
 * 1. Ask backend for the authorize URL (backend signs the state JWT).
 * 2. Open in-app browser. Fitbit redirects to backend callback on success.
 * 3. Backend exchanges code → tokens, encrypts + stores them, then 302s to
 *    `vitalsync://oauth-success?source=FITBIT`.
 * 4. expo-web-browser closes when it sees the deep-link prefix.
 *
 * The phone never sees Fitbit's client_secret.
 */
export async function startOAuthConnect(source: HealthSource): Promise<OAuthResult> {
  try {
    const res = await sourcesApi.connect(source);
    if (res.flow !== "OAUTH" || !res.authorizeUrl) {
      return { ok: false, reason: "error", detail: `Not an OAuth source: ${source}` };
    }
    const result = await WebBrowser.openAuthSessionAsync(
      res.authorizeUrl,
      "vitalsync://oauth-success",
    );
    if (result.type === "success") return { ok: true };
    if (result.type === "cancel" || result.type === "dismiss") {
      return { ok: false, reason: "cancelled" };
    }
    return { ok: false, reason: "error", detail: result.type };
  } catch (e) {
    return { ok: false, reason: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}
