## Setup (fresh clone)

If `graphify-out/` does not exist OR `graphify` CLI is missing, run **first**:

```
./scripts/setup.sh
```

Idempotent. Installs graphify, builds the knowledge graph, installs git hooks. After that the rules below apply.

## Project Snapshot

Multi-source health aggregation:
- **Phone-local sources**: Health Connect (Android), Gadgetbridge BLE (custom local Expo module)
- **Backend-polled cloud sources**: Fitbit + Strava (OAuth2 every 15 min), WHOOP (email+pass, daily 09:00 IST)
- **Storage**: 3 tables — `health_snapshot_record` (raw) / `hourly_summary` / `daily_summary`
- **Analytics**: cross-source aggregated, NEVER per-source filtered. Routes by range to the right tier.
- **Backfill**: phased (30d → 6mo → 2yr), resumable via `@PostConstruct` on JVM restart.

## Running the Frontend (Physical Android Device via USB)

### One-time per USB session
```bash
adb reverse tcp:8082 tcp:8082   # Metro bundler
adb reverse tcp:8083 tcp:8083   # Spring Boot backend
```
Must re-run after every USB disconnect.

### Start Metro
```bash
cd frontend
npx expo start --port 8082
```

### Build + install (first time or after native changes)
```bash
cd frontend
export JAVA_HOME=/Users/sushrutda/Library/Java/JavaVirtualMachines/temurin-17.0.19/Contents/Home
export ANDROID_HOME=/Users/sushrutda/android-sdk
npx expo run:android --port 8082
```

### Connect dev launcher to Metro
After app opens to the Expo scanner screen, deep-link:
```bash
adb shell am start -a "android.intent.action.VIEW" \
  -d "exp+vitalsync://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082"
```
Or tap **Tools → Enter URL manually → `http://localhost:8082`**

### Backend URL
`.env.local` sets `EXPO_PUBLIC_API_BASE_URL=http://localhost:8083`.
Works on physical device only when `adb reverse tcp:8083 tcp:8083` is active.

## Backend env vars (multi-source)

```bash
# Encryption for OAuth tokens / WHOOP creds (CredentialVault)
export VITALSYNC_CRED_KEY=$(openssl rand -hex 32)
export VITALSYNC_CRED_SALT=$(openssl rand -hex 8)

# Fitbit (register app at dev.fitbit.com)
export FITBIT_CLIENT_ID=...
export FITBIT_CLIENT_SECRET=...
export FITBIT_REDIRECT_URI=http://localhost:8083/api/v1/sources/FITBIT/callback

# Strava (register app at strava.com/settings/api)
export STRAVA_CLIENT_ID=...
export STRAVA_CLIENT_SECRET=...
export STRAVA_REDIRECT_URI=http://localhost:8083/api/v1/sources/STRAVA/callback

# JWT (HS256, min 32 bytes)
export JWT_SECRET=$(openssl rand -hex 32)
```

## Known Fixes Applied

### MainActivity.kt — Health Connect delegate order (CRITICAL)
`HealthConnectPermissionDelegate.setPermissionDelegate(this)` MUST be called **before** `super.onCreate()`.
`registerForActivityResult` must register before activity reaches STARTED state — calling it after causes HC permission dialog to silently fail.

File: `frontend/android/app/src/main/java/com/vitalsync/app/MainActivity.kt`

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    HealthConnectPermissionDelegate.setPermissionDelegate(this)  // BEFORE super
    super.onCreate(null)
}
```

### AuroraBackground — removed expo-linear-gradient (native module missing)
`expo-linear-gradient` was in `package.json` but native Android module was never compiled. Caused crash before JS bundle executed. Replaced `LinearGradient` with two stacked `View`s in `AuroraBackground.tsx`.
> After adding any new native package: always run `npx expo run:android` to recompile native modules.

### _layout.tsx — AuroraBackground outside TamaguiProvider
Font-loading fallback rendered `<AuroraBackground />` before `ThemeProvider`/`TamaguiProvider` was mounted, causing "Can't find Tamagui configuration" crash. Fixed: fallback now returns a plain `<View>` only.

### DevLauncher connection — use Recently Opened, not deep link
Sending competing deep links (auto-open + manual) causes Java crash. Instead:
1. `adb shell am force-stop com.vitalsync.app`
2. `adb shell am start -n com.vitalsync.app/.MainActivity`
3. Wait for DevLauncher → tap **"VitalSync"** in **"Recently Opened"** (green dot = Metro reachable)

### React Compiler + Tamagui RC = infinite render loop
`"reactCompiler": true` in `app.json` makes Tamagui's `useSyncExternalStore` return unstable snapshots → `Maximum update depth exceeded` inside `<Theme2>` / `<TamaguiProvider>`.
**Fix**: set `"reactCompiler": false` in `app.json` AND wrap `TamaguiProvider` in `React.memo()` with a **static** `defaultTheme="dark"`. Dynamic `defaultTheme={resolved}` also triggers the loop on React 19.2 + Tamagui 2 RC. Theme switching at the Tamagui layer is disabled; our own components still read `useThemePref().resolved` for color tokens.

### Nested `<Theme>` inside `<TamaguiProvider>` triggers Theme2 loop
`ThemedShell` wrapped children in `<Theme name={resolved}>` redundantly (Tamagui's own `defaultTheme` already handles this). The inner `<Theme>` mounts a separate `Theme2` instance whose internal `useSyncExternalStore` re-fires on every parent render → "Maximum update depth exceeded".
**Fix**: remove the inner `<Theme>` wrapper entirely. `defaultTheme` on the provider is sufficient.

### Local Expo module not autolinked
`frontend/modules/gadgetbridge/expo-module.config.json` must declare the module class explicitly:
```json
{ "platforms": ["android"], "android": { "modules": ["com.vitalsync.gadgetbridge.GadgetbridgeModule"] } }
```
Without it `requireNativeModule` throws `Cannot find native module 'Gadgetbridge'`.

### `source` column migration on existing rows
`ddl-auto: update` failed adding `NOT NULL` source column to existing `health_snapshot_record` rows. Backfill data first:
```sql
ALTER TABLE health_snapshot_record ADD COLUMN IF NOT EXISTS source varchar(32);
UPDATE health_snapshot_record SET source = 'HEALTH_CONNECT' WHERE source IS NULL;
```
Then restart backend so JPA can apply the `NOT NULL` constraint.

### `CredentialVault` — No default constructor found
Lombok `@RequiredArgsConstructor` conflicted with the explicit `@Value`-injecting constructor. Remove `@RequiredArgsConstructor` from the class.

### `frontend/modules/<name>/android/` is gitignored
The broad `frontend/android` gitignore rule swallows local module Android dirs too. Force-add: `git add -f frontend/modules/gadgetbridge/android/`.

## graphify

This project uses a graphify knowledge graph at `graphify-out/` to save tokens on architecture / codebase questions. The dir is gitignored — `scripts/setup.sh` regenerates it on a fresh clone.

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse EXTRACTED + INFERRED edges instead of scanning files
- After modifying code in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
- A `post-commit` git hook auto-runs `graphify update .` — installed by `scripts/setup.sh`. Verify with `graphify hook status`
- For continuous live updates while coding, run `graphify watch .` in a side terminal

If `graphify` is missing on this machine, re-run `./scripts/setup.sh`.

