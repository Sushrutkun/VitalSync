# VitalSync — Agent Context

## Project Overview
Expo (React Native) + Spring Boot monorepo. Android-only frontend. Backend on port 8083 (Java 17, Spring Boot). Health data via Android Health Connect.

## Stack
- **Frontend**: Expo SDK, React Native, expo-router, Tamagui, TanStack Query
- **Backend**: Spring Boot 3, Java 17, Kafka, JWT auth, port 8083
- **Health**: `react-native-health-connect` (Android Health Connect API)

## Running Locally

### Backend
```bash
cd backend
./mvnw spring-boot:run
# Runs on :8083
```

### Frontend (physical Android device via USB)
```bash
# 1. Reverse ports (every USB reconnect)
adb reverse tcp:8082 tcp:8082
adb reverse tcp:8083 tcp:8083

# 2. Start Metro
cd frontend && npx expo start --port 8082

# 3. Build + install (first time / after native changes)
cd frontend && npx expo run:android --port 8082

# 4. Connect dev launcher (after install, if scanner screen shows)
adb shell am start -a "android.intent.action.VIEW" \
  -d "exp+vitalsync://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082"
```

## Key Files
| File | Purpose |
|------|---------|
| `frontend/app/(app)/index.tsx` | Today screen — dashboard + sync trigger |
| `frontend/src/health/permissions.ts` | HC permission request/check logic |
| `frontend/src/health/sync.ts` | Reads HC data, posts to backend |
| `frontend/plugins/withHealthConnectPermissions.js` | Expo config plugin — injects HC manifest permissions + delegate |
| `frontend/android/app/src/main/java/com/vitalsync/app/MainActivity.kt` | Native entry — HC delegate must be before super.onCreate |
| `backend/src/main/java/com/vitalsync/config/SecurityConfig.java` | JWT auth filter, CORS config |
| `backend/src/main/java/com/vitalsync/controller/HealthQueryController.java` | Health read endpoints (stub — returns zeros until read store lands) |

## Critical Bugs Fixed

### 1. Health Connect permission dialog never appeared
**Root cause**: `HealthConnectPermissionDelegate.setPermissionDelegate(this)` was called after `super.onCreate()`.
`registerForActivityResult` must be called before activity reaches STARTED state.

**Fix** (`MainActivity.kt`):
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    HealthConnectPermissionDelegate.setPermissionDelegate(this)  // must be before super
    super.onCreate(null)
}
```

### 2. API calls fail on physical device ("Network request failed")
**Root cause**: `localhost:8083` on physical device resolves to the device, not the Mac.
**Fix**: `adb reverse tcp:8083 tcp:8083` tunnels device localhost → Mac port 8083. Must re-run after USB reconnect.

## Health Connect Permissions Flow
1. User taps "Sync now" on Today screen
2. `ensureHealthPermissions()` called → requests missing permissions
3. HC dialog appears (requires delegate set before `super.onCreate`)
4. On grant → `syncLastMinute()` reads HC records → posts to `/api/v1/health/sync`

## Security Notes
- `/api/v1/health/**` requires JWT — not in `permitAll()` list in `SecurityConfig`
- Auth token stored in `expo-secure-store`
- CORS allows only `localhost:*` origins
