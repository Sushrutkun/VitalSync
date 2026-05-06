export type HealthConnectStatus =
  | "available"
  | "unavailable"
  | "provider-update-required"
  | "unsupported-platform";

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  return "unsupported-platform";
}

export async function hasHealthPermissions(): Promise<boolean> {
  return false;
}

export async function ensureHealthPermissions(): Promise<{ granted: boolean; missing: never[] }> {
  return { granted: false, missing: [] };
}
