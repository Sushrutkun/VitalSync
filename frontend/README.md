# VitalSync Frontend

Expo + React Native app. Package: `com.vitalsync.app`.

## Prerequisites

- Node 18+, npm
- Android SDK + `adb` on PATH
- JDK 17 (for Gradle)
- Device with USB debugging on, or running emulator

> All commands below are run from this `frontend/` directory unless stated otherwise.

## Install

```bash
npm install
```

## ADB Setup

Reverse Metro (8081) and the backend API (8080, see `backend/docker-compose.yml`):

```bash
adb devices -l
adb reverse tcp:8081 tcp:8081   # Metro bundler
adb reverse tcp:8083 tcp:8083   # backend API
```

## Dev Run (debug, hot reload)

```bash
npx expo run:android
```

Metro only (already installed):

```bash
npm start
adb shell am start -n com.vitalsync.app/.MainActivity
```

## Release Build

APK:

```bash
cd android
./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

AAB (Play Store):

```bash
cd android
./gradlew bundleRelease
# output: android/app/build/outputs/bundle/release/app-release.aab
```

## Install + Launch Release APK

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p com.vitalsync.app -c android.intent.category.LAUNCHER 1
```

## Logs

```bash
adb logcat *:S ReactNative:V ReactNativeJS:V    # JS only
adb logcat | grep -i vitalsync
```

## Clean Rebuild

```bash
rm -rf node_modules android
npm install
npx expo prebuild --clean   # regenerates android/
npx expo run:android
```

> Do **not** run `./gradlew clean` after wiping `node_modules` — CMake will fail
> on stale autolinking refs to deleted codegen dirs. Just delete `android/` and
> let `expo prebuild --clean` regenerate it.

## Other Targets

```bash
npm run ios       # iOS simulator
npm run web       # web build
npm run lint
```

## Project Layout

- `app/` — expo-router file-based routes
- `src/` — components, hooks, types, services
- `android/` — native Android project (generated via `expo prebuild`)
- `assets/` — fonts, images
