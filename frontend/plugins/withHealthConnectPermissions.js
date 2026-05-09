// Adds the missing <uses-permission android:name="android.permission.health.READ_*" />
// entries that react-native-health-connect's bundled plugin (v3.x) does NOT inject.
// Without these, Health Connect silently refuses to show its permission dialog.
//
// Usage in app.json:
//   ["./plugins/withHealthConnectPermissions", { "permissions": ["HeartRate", ...] }]

const { withAndroidManifest, withMainActivity } = require("@expo/config-plugins");

// Map of recordType -> Health Connect Android permission name.
// Only "read" access is supported here (matches our REQUIRED_PERMISSIONS list).
const READ_PERMISSION = {
  HeartRate: "android.permission.health.READ_HEART_RATE",
  Steps: "android.permission.health.READ_STEPS",
  OxygenSaturation: "android.permission.health.READ_OXYGEN_SATURATION",
  ActiveCaloriesBurned: "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
  Distance: "android.permission.health.READ_DISTANCE",
  ExerciseSession: "android.permission.health.READ_EXERCISE",
  RestingHeartRate: "android.permission.health.READ_RESTING_HEART_RATE",
  SleepSession: "android.permission.health.READ_SLEEP",
  TotalCaloriesBurned: "android.permission.health.READ_TOTAL_CALORIES_BURNED",
  BodyTemperature: "android.permission.health.READ_BODY_TEMPERATURE",
  BloodPressure: "android.permission.health.READ_BLOOD_PRESSURE",
  BloodGlucose: "android.permission.health.READ_BLOOD_GLUCOSE",
  Weight: "android.permission.health.READ_WEIGHT",
  Height: "android.permission.health.READ_HEIGHT",
};

const DELEGATE_IMPORT =
  "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate";
const DELEGATE_CALL =
  "HealthConnectPermissionDelegate.setPermissionDelegate(this)";

function injectMainActivity(config) {
  return withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === "kt";
    if (!isKotlin) {
      // Project uses Kotlin MainActivity by default in modern Expo; bail if not.
      return cfg;
    }

    if (!src.includes(DELEGATE_IMPORT)) {
      src = src.replace(
        /(^package [^\n]+\n)/m,
        `$1\n${DELEGATE_IMPORT}\n`,
      );
    }

    if (!src.includes(DELEGATE_CALL)) {
      // If onCreate already exists, inject the call BEFORE super.onCreate(...)
      // (registerForActivityResult must happen before the activity reaches STARTED).
      if (/override\s+fun\s+onCreate\s*\(/.test(src)) {
        src = src.replace(
          /(super\.onCreate\([^)]*\))/,
          `${DELEGATE_CALL}\n    $1`,
        );
      } else {
        // Otherwise add a full onCreate override before the final closing brace of MainActivity class.
        src = src.replace(
          /(\n)(}\s*)$/,
          `\n  override fun onCreate(savedInstanceState: android.os.Bundle?) {\n` +
            `    super.onCreate(savedInstanceState)\n` +
            `    ${DELEGATE_CALL}\n` +
            `  }\n$2`,
        );
      }
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = function withHealthConnectPermissions(config, props = {}) {
  const permissions = Array.isArray(props.permissions) ? props.permissions : [];
  const androidNames = permissions
    .map((p) => READ_PERMISSION[p])
    .filter(Boolean);

  let next = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    const existing = new Set(
      manifest["uses-permission"].map((p) => p.$ && p.$["android:name"]).filter(Boolean),
    );
    for (const name of androidNames) {
      if (existing.has(name)) continue;
      manifest["uses-permission"].push({ $: { "android:name": name } });
    }
    return cfg;
  });

  next = injectMainActivity(next);
  return next;
};
