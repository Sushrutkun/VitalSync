import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
  type Permission,
} from "react-native-health-connect";

const REQUIRED_PERMISSIONS: Permission[] = [
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "OxygenSaturation" },
  { accessType: "read", recordType: "ActiveCaloriesBurned" },
  { accessType: "read", recordType: "Distance" },
  { accessType: "read", recordType: "ExerciseSession" },
  { accessType: "read", recordType: "RestingHeartRate" },
  { accessType: "read", recordType: "SleepSession" },
];

export type HealthConnectStatus =
  | "available"
  | "unavailable"
  | "provider-update-required"
  | "unsupported-platform";

let initialized = false;

async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  initialized = await initialize();
  return initialized;
}

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return "available";
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return "provider-update-required";
    }
    return "unavailable";
  } catch {
    return "unsupported-platform";
  }
}

export async function hasHealthPermissions(): Promise<boolean> {
  const ok = await ensureInitialized();
  if (!ok) return false;
  const granted = await getGrantedPermissions();
  return REQUIRED_PERMISSIONS.every((req) =>
    granted.some((g) => g.recordType === req.recordType && g.accessType === req.accessType),
  );
}

export async function ensureHealthPermissions(): Promise<{
  granted: boolean;
  missing: Permission[];
}> {
  const ok = await ensureInitialized();
  if (!ok) return { granted: false, missing: REQUIRED_PERMISSIONS };

  const granted = await getGrantedPermissions();
  const missing = REQUIRED_PERMISSIONS.filter(
    (req) => !granted.some((g) => g.recordType === req.recordType && g.accessType === req.accessType),
  );
  if (missing.length === 0) return { granted: true, missing: [] };

  const after = await requestPermission(missing).catch(() => []);
  const stillMissing = missing.filter(
    (req) => !after.some((g) => g.recordType === req.recordType && g.accessType === req.accessType),
  );
  return { granted: stillMissing.length === 0, missing: stillMissing };
}

export async function getMissingHealthPermissions(): Promise<Permission[]> {
  const ok = await ensureInitialized();
  if (!ok) return REQUIRED_PERMISSIONS;
  const granted = await getGrantedPermissions();
  return REQUIRED_PERMISSIONS.filter(
    (req) => !granted.some((g) => g.recordType === req.recordType && g.accessType === req.accessType),
  );
}

export function openHealthConnectAppSettings(): void {
  openHealthConnectSettings();
}
