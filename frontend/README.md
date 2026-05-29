# VitalSync Frontend

Expo (React Native) Android app. Reads health data from Android Health Connect and syncs to the VitalSync backend.

**Package**: `com.vitalsync.app`  
**Min SDK**: 26 (Android 8)  
**Metro default port**: `8082`  
**Backend port**: `8083`

---

## Prerequisites (all setups)

| Tool | Version | Install |
|---|---|---|
| Node | 18+ | [nodejs.org](https://nodejs.org) |
| npm | bundled with Node | — |
| JDK | 17 | `brew install openjdk@17` / [Adoptium](https://adoptium.net) |
| Android SDK + `adb` | any recent | Android Studio or standalone SDK |

```bash
cd frontend
npm install
```

---

## Setup A — USB (same laptop, physical Android device)

Best for active development. Fastest hot reload.

### Step 1 — Enable USB debugging on device
Settings → Developer options → USB debugging ON.

### Step 2 — Reverse ports (run after every USB reconnect)

```bash
adb devices                      # confirm device shows as "device"
adb reverse tcp:8082 tcp:8082    # Metro bundler
adb reverse tcp:8083 tcp:8083    # Backend API
```

### Step 3 — Create `.env.local`

```bash
# frontend/.env.local
EXPO_PUBLIC_API_BASE_URL=http://localhost:8083
```

### Step 4 — Start Metro

```bash
npx expo start --port 8082
```

### Step 5 — Build + install app (first time, or after native code changes)

```bash
npx expo run:android --port 8082
```

This compiles Kotlin/Java and installs the APK via ADB. Takes ~3 min first run.

### Step 6 — Connect dev launcher

After install the app opens to an Expo scanner screen. Connect it to Metro:

```bash
adb shell am start -a "android.intent.action.VIEW" \
  -d "exp+vitalsync://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082"
```

Or tap **Tools (top-right) → Enter URL manually** → `http://localhost:8082`

### Subsequent runs (app already installed)

```bash
adb reverse tcp:8082 tcp:8082
adb reverse tcp:8083 tcp:8083
npx expo start --port 8082
# Open app on device — it auto-connects to Metro
```

---

## Setup B — WiFi (another device on the same network, OR physical device without USB)

No USB cable needed. Both laptop and device must be on the same LAN.

### Step 1 — Find your laptop's LAN IP

```bash
# macOS
ipconfig getifaddr en0        # WiFi
ipconfig getifaddr en1        # Ethernet (if wired)

# Linux
ip addr show | grep "inet " | grep -v 127
```

Example result: `192.168.1.42`

### Step 2 — Create `.env.local`

```bash
# frontend/.env.local  — replace with YOUR laptop IP
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:8083
```

### Step 3 — Allow backend through firewall (macOS)

System Settings → Network → Firewall → allow incoming connections for Java / the terminal.  
Or temporarily disable firewall during dev.

### Step 4 — Start Metro with LAN host

```bash
npx expo start --port 8082 --host lan
```

Metro prints a QR code and a URL like `exp://192.168.1.42:8082`.

### Step 5 — Build + install on device (first time)

Plug device via USB just for install, then unplug:

```bash
npx expo run:android --port 8082
```

Or install a pre-built debug APK if available:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 6 — Open app on device

After install, open the app. In the Expo scanner:
- Scan the QR code Metro printed, **or**
- Tap **Tools → Enter URL manually** → `exp://192.168.1.42:8082`

---

## Setup C — Another Laptop (fresh clone)

### Step 1 — Clone and install

```bash
git clone <repo-url>
cd VitalSync/frontend
npm install
```

### Step 2 — Start backend on that laptop, or point to a shared backend

**Option A — run backend locally on the new laptop:**
```bash
cd ../backend
docker compose up -d
./mvnw spring-boot:run      # backend on :8083
```

**Option B — use another machine's backend over LAN:**  
Skip this step; set `EXPO_PUBLIC_API_BASE_URL` to the remote machine's IP in Step 3.

### Step 3 — Create `.env.local`

```bash
# If backend is on this laptop (USB setup):
EXPO_PUBLIC_API_BASE_URL=http://localhost:8083

# If backend is on another machine (WiFi setup):
EXPO_PUBLIC_API_BASE_URL=http://<backend-machine-LAN-IP>:8083
```

### Step 4 — Follow Setup A (USB) or Setup B (WiFi) above

The steps for starting Metro, building, and installing are identical.

---

## Health Connect Permissions

HC permissions are requested when the user taps **"Sync now"** on the Today screen.  
Required permissions: `HeartRate`, `Steps`, `OxygenSaturation`, `ActiveCaloriesBurned`, `Distance`, `ExerciseSession`, `RestingHeartRate`, `SleepSession`.

**If the permission dialog never appears** — this is a known issue if the app was built without the delegate fix. Rebuild with:

```bash
npx expo run:android --port 8082
```

The fix is already applied in `android/app/src/main/java/com/vitalsync/app/MainActivity.kt` — `HealthConnectPermissionDelegate.setPermissionDelegate(this)` is called before `super.onCreate()`.

> **Warning:** `expo prebuild --clean` regenerates `android/` and will re-apply the config plugin (`plugins/withHealthConnectPermissions.js`) which preserves this ordering. Do not manually move the delegate call after `super.onCreate()`.

---

## Clean Rebuild

```bash
rm -rf node_modules android
npm install
npx expo prebuild --clean       # regenerates android/
npx expo run:android --port 8082
```

> Do **not** run `./gradlew clean` after wiping `node_modules` — CMake fails on stale autolinking refs. Delete `android/` and let `expo prebuild` regenerate it.

---

## Useful Commands

```bash
# Logs (JS only)
adb logcat -s ReactNativeJS:V ReactNative:V

# Logs (crashes)
adb logcat -s AndroidRuntime:E

# Screenshot
adb exec-out screencap -p > screen.png

# Open app directly
adb shell am start -n com.vitalsync.app/.MainActivity

# Check Metro
curl http://localhost:8082/status

# Lint
npm run lint
```

---

## Build Release APK

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## Project Layout

```
frontend/
├── app/                    expo-router file-based routes
│   ├── (app)/index.tsx     Today screen (dashboard)
│   ├── (app)/history.tsx   History screen
│   └── (auth)/             Login / signup screens
├── src/
│   ├── api/                API clients (health, auth)
│   ├── auth/               Auth context + token storage
│   ├── components/ui/      Design system components
│   ├── health/             HC permissions, sync, background tasks
│   └── lib/                Fetch wrapper, debug logger
├── plugins/
│   └── withHealthConnectPermissions.js   Expo config plugin
├── android/                Native Android project (Expo-managed)
└── .env.local              Local env — not committed
```
