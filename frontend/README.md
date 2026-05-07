# VitalSync Frontend

Expo + React Native app. Package: `com.vitalsync.app`.

## Prerequisites

- Node 18+, npm
- Android SDK + `adb` on PATH
- JDK 17 (for Gradle)
- Device with USB debugging on, or running emulator

## Install

```bash
npm install
```

## ADB Setup

```bash
adb devices                          # confirm device attached
adb reverse tcp:8081 tcp:8081        # Metro bundler
adb reverse tcp:8000 tcp:8000        # backend (if local)
```

## Dev Run (debug, hot reload)

```bash
npx expo run:android                 # build debug APK + install + launch Metro
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
cd android && ./gradlew clean && cd ..
rm -rf node_modules && npm install
npx expo prebuild --clean            # regen android/ from app.json
```

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
