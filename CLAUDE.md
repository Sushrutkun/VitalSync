## Setup (fresh clone)

If `graphify-out/` does not exist OR `graphify` CLI is missing, run **first**:

```
./scripts/setup.sh
```

Idempotent. Installs graphify, builds the knowledge graph, installs git hooks. After that the rules below apply.

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
npx expo run:android --port 8082
```
No Android SDK on this Mac — `ANDROID_HOME` is unset. Build still works via Gradle wrapper using ADB device.

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
