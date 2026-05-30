# VitalSync — Agent Context

## Project Overview
Expo (React Native) + Spring Boot monorepo. Android-only frontend. Backend on port 8083 (Java 17, Spring Boot). Multi-source health aggregation — Health Connect, Gadgetbridge BLE, Fitbit, Strava, WHOOP.

## Stack
- **Frontend**: Expo SDK 55, React Native, expo-router, Tamagui, TanStack Query
- **Backend**: Spring Boot 3, Java 17, Kafka, JWT auth, port 8083
- **Health sources**: `react-native-health-connect` (HC), custom Expo module (Gadgetbridge), Fitbit/Strava OAuth, WHOOP unofficial
- **Storage**: Postgres (3-tier: raw snapshots + hourly_summary + daily_summary), Kafka topic `vitalsync-data-ingestion`

## Architecture

### Ingestion pipeline (cross-source)
```
Phone push  ─► POST /health/sync  source=HC|GADGETBRIDGE
Cloud poll  ─► SourcePollerScheduler  source=FITBIT|STRAVA|WHOOP
                  │
                  ▼ HealthSnapshotPublisher
              Kafka (key=userId, header=idempotency-key)
                  │
                  ▼ HealthConsumerService
            ├─► health_snapshot_record  (raw, namespaced idempotency key ${source}:${uuid})
            ├─► hourly_summary          (upsert per hour bucket)
            └─► daily_summary           (upsert live + scheduler-recompute at 00:00 IST)
```

### Analytics routing (`/health/analytics?range=...`)
- HOUR → raw `health_snapshot_record` (last 60 min)
- DAY  → `hourly_summary` (24 buckets)
- WEEK / MONTH / YEAR → `daily_summary` (cross-source aggregated — no per-source filter, ever)

### Backfill (cloud sources)
- `BackfillRunner` @Async, 3 phases (30d / 180d / 730d)
- Cursor walks backward in 7-day chunks, checkpoints to `backfill_state` after each chunk
- `@PostConstruct resumeInFlight` re-kicks any IN_PROGRESS rows on JVM restart
- Stable idempotency keys (`day-{date}` for Fitbit, `activity-{id}` for Strava) → re-runs dedupe at DB

## Running Locally

### Backend
```bash
cd backend
./mvnw spring-boot:run     # Runs on :8083
# Or with built JAR:
java -jar target/vitalsync-backend-0.0.1-SNAPSHOT.jar
```

### Frontend (physical Android device via USB)
```bash
adb reverse tcp:8082 tcp:8082
adb reverse tcp:8083 tcp:8083

cd frontend
npx expo start --port 8082

# First time or after native module changes:
npx expo run:android --port 8082

# Force-connect dev launcher to Metro:
adb shell am start -a "android.intent.action.VIEW" \
  -d "exp+vitalsync://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082"
```

## Key Files

### Frontend
| File | Purpose |
|------|---------|
| `app/(app)/index.tsx` | Dashboard (Today screen) |
| `app/(app)/sources.tsx` | Multi-source connect/disconnect UI |
| `app/(app)/sources-whoop.tsx` | WHOOP email+password form |
| `app/(app)/source-backfill.tsx` | Per-phase cloud backfill progress |
| `app/(app)/backfill.tsx` | Health Connect bulk-sync (date range or last N days) |
| `src/sources/SourcesContext.tsx` | `useSources()` hook |
| `src/sources/oauth.ts` | `startOAuthConnect()` via expo-web-browser |
| `src/health/sync.ts` | HC sync (checkpoint-based + explicit window) |
| `src/health/gadgetbridge.ts` | GB sample batcher + 15-min flush |
| `modules/gadgetbridge/` | Local Kotlin Expo module (BroadcastReceiver) |
| `plugins/withHealthConnectPermissions.js` | Config plugin — HC manifest perms + delegate injection |
| `plugins/withGadgetbridgeQueries.js` | Config plugin — adds GB `<queries>` to manifest |
| `android/app/src/main/java/com/vitalsync/app/MainActivity.kt` | Native entry — HC delegate **must** be set before super.onCreate |

### Backend
| File | Purpose |
|------|---------|
| `controller/HealthSyncController.java` | POST /health/sync — namespaces idempotency key as `${source}:${uuid}` |
| `controller/SourcesController.java` | GET/POST/DELETE /sources/{source}/{connect,callback,credentials,backfill} |
| `service/source/SourceAdapter.java` | Interface — beginConnect / completeOAuth / submitCredentials / pollLatest / fetchBackfillChunk |
| `service/source/FitbitAdapter.java` | Fitbit OAuth2 + poll + backfill |
| `service/source/StravaAdapter.java` | Strava OAuth2 + activity poll/backfill |
| `service/source/WhoopAdapter.java` | WHOOP cred storage (poll stub — real ingestion pending) |
| `service/source/SourcePollerScheduler.java` | @Scheduled(PT15M) cloud poll + @Scheduled(cron 0 0 9 IST) WHOOP |
| `service/source/BackfillRunner.java` | @Async phased backfill engine + @PostConstruct resume |
| `service/source/OAuthStateService.java` | Signs short-lived state JWT for CSRF protection |
| `service/source/SourcesService.java` | Adapter registry + dispatch |
| `service/CredentialVault.java` | Spring Security TextEncryptor (AES-256 + HMAC-SHA256) |
| `service/HealthConsumerService.java` | Kafka listener → writes to all 3 tables |
| `service/DailySummaryScheduler.java` | @Scheduled(cron 0 0 0 IST) — recomputes yesterday's daily_summary from raw |
| `entity/HealthSource.java` | Enum: HEALTH_CONNECT, HEALTHKIT, GADGETBRIDGE, FITBIT, STRAVA, WHOOP |
| `entity/UserSourceCredential.java` | Per-(user, source) state with encrypted tokens/creds |
| `entity/BackfillState.java` | Phased cursor state, resumable on JVM restart |
| `entity/HourlySummary.java` | Hourly aggregate (cross-source MAX merge) |

## Critical Bugs Fixed

### Health Connect permission dialog never appeared
Root cause: `HealthConnectPermissionDelegate.setPermissionDelegate(this)` was called after `super.onCreate()`. `registerForActivityResult` must register before STARTED state.
Fix (`MainActivity.kt`): delegate set **before** `super.onCreate(null)`.

### API calls fail on physical device
`localhost:8083` on phone = phone itself. Fix: `adb reverse tcp:8083 tcp:8083` after every USB reconnect.

### `Cannot find native module 'Gadgetbridge'`
Local Expo module's `expo-module.config.json` was missing the `android.modules` declaration. Without it, autolinking ignored the module class.
Fix: add `{"android":{"modules":["com.vitalsync.gadgetbridge.GadgetbridgeModule"]}}` and rebuild APK.

### React Compiler + Tamagui RC infinite render loop
`"reactCompiler": true` in `app.json` triggers Tamagui's `useSyncExternalStore` to return unstable snapshots → "Maximum update depth exceeded" inside `<Theme2>`.
Fix: `"reactCompiler": false` AND wrap `TamaguiProvider` in `memo()` with **static** `defaultTheme="dark"` (dynamic `defaultTheme={resolved}` also loops on React 19.2 + Tamagui 2 RC). Color tokens still drive via `useThemePref().resolved` in app components.

### Nested `<Theme>` inside `<TamaguiProvider>` loops Theme2
`ThemedShell` redundantly wrapped children in `<Theme name={resolved}>`. Inner Theme2 instance's `useSyncExternalStore` re-fires every parent render. Fix: drop the inner `<Theme>` — `defaultTheme` on the provider is enough.

### `CredentialVault` — "No default constructor found"
Lombok `@RequiredArgsConstructor` conflicted with the explicit `@Value`-injecting constructor.
Fix: remove `@RequiredArgsConstructor`.

### `source` column NOT NULL migration on existing rows
`ddl-auto: update` tried to add `NOT NULL` source column; existing rows had NULL → migration failed.
Fix (one-shot SQL): `ALTER TABLE health_snapshot_record ADD COLUMN IF NOT EXISTS source varchar(32); UPDATE ... SET source = 'HEALTH_CONNECT' WHERE source IS NULL;` then restart.

## OAuth Security Model
- `state` parameter = short-lived signed JWT (HMAC, separate key derived from auth secret via SHA-256 + domain tag — leaked state can never be used as access token)
- `client_secret` never reaches the phone — backend handles token exchange
- Tokens encrypted at rest via `CredentialVault` (`access_token_enc`, `refresh_token_enc`, `credentials_json_enc`)
- WHOOP password also encrypted (no OAuth available)

## Idempotency
- Snapshot dedup: `health_snapshot_record.idempotency_key` unique → `${source}:${client_uuid}` namespacing means same window from HC + Fitbit produces two distinct rows
- Backfill: stable per-day / per-activity keys (`day-{date}`, `activity-{strava_id}`) so re-runs of the same chunk dedupe at DB

