# VitalSync

Multi-source health data aggregation platform. Android app (Expo/React Native) + Spring Boot backend + Kafka pipeline.

Aggregates fitness data from Health Connect, Gadgetbridge (BLE wearables), Fitbit, Strava, and WHOOP into a single per-user analytics view.

## Architecture

```
Phone-local sources                          Cloud sources
─────────────────────                        ─────────────────────
Health Connect (Android)                     Fitbit  (15-min poll)
Gadgetbridge   (BLE broadcasts)              Strava  (15-min poll)
HealthKit      (future)                      WHOOP   (daily poll)
   │                                            │
   ▼ POST /api/v1/health/sync                   ▼ SourcePollerScheduler
   ─────────────────────────────────────────────────
                    │
                    ▼
          Spring Boot :8083  →  Kafka (vitalsync-data-ingestion)
                                    │
                                    ▼
                        HealthConsumerService
                          ├─► health_snapshot_record  (raw ticks, with source)
                          ├─► hourly_summary          (24 hourly buckets/day)
                          └─► daily_summary           (1 row/day)
                                    ▲
                       DailySummaryScheduler @ 00:00 IST
                       (full recompute of yesterday)
```

**Analytics routing** (`/api/v1/health/analytics?range=...`):
- HOUR → raw snapshots (~4 points)
- DAY  → hourly_summary (24 points)
- WEEK/MONTH/YEAR → daily_summary (cross-source aggregated)

## Repo Layout

```
VitalSync/
├── frontend/                  Expo React Native app (Android)
│   ├── app/                   File-based routes (expo-router)
│   ├── src/sources/           Multi-source UI + OAuth flow
│   ├── src/health/            Health Connect + Gadgetbridge sync
│   ├── modules/gadgetbridge/  Local Kotlin Expo module (BroadcastReceiver)
│   └── plugins/               Expo config plugins (HC perms, GB queries)
├── backend/                   Spring Boot 3 API (Java 17)
│   └── src/.../service/source/  SourceAdapter, FitbitAdapter, StravaAdapter,
│                                WhoopAdapter, SourcePollerScheduler,
│                                BackfillRunner, OAuthStateService, CredentialVault
├── k8s/                       Kubernetes manifests
├── scripts/                   Setup + load-gen utilities
└── docs/                      API spec
```

---

## Quick Start

### 1 — Start backend infrastructure

```bash
cd backend
docker compose up -d        # Postgres :5432 · Kafka :9092 · Kafka-UI :8081
```

Wait ~20s for Kafka, then:

```bash
./mvnw spring-boot:run      # API on :8083
```

### 2 — Start frontend

See [`frontend/README.md`](frontend/README.md) for USB device setup.

---

## Environment Variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/vitalsync` | Postgres JDBC URL |
| `DB_USER` / `DB_PASSWORD` | `vitalsync` / `vitalsync` | Postgres creds |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker |
| `JWT_SECRET` | `change-me-in-prod-...` | HS256, min 32 bytes — **rotate in prod** |
| `VITALSYNC_CRED_KEY` | `dev-key-do-not-use-in-prod` | Master key for OAuth-token encryption (CredentialVault) |
| `VITALSYNC_CRED_SALT` | `5f4dcc3b5aa765d6` | Salt (hex) for CredentialVault |
| `FITBIT_CLIENT_ID` / `FITBIT_CLIENT_SECRET` | — | From dev.fitbit.com app registration |
| `FITBIT_REDIRECT_URI` | `http://localhost:8083/api/v1/sources/FITBIT/callback` | Must match Fitbit app config |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | — | From strava.com/settings/api |
| `STRAVA_REDIRECT_URI` | `http://localhost:8083/api/v1/sources/STRAVA/callback` | Must match Strava app config |

Generate a secure secret:
```bash
openssl rand -hex 32
```

## Sources

| Source | Connect | Live poll | Backfill |
|---|---|---|---|
| HEALTH_CONNECT | On-device permission | Phone pushes every 15 min | Frontend `/backfill` (per-day window) |
| GADGETBRIDGE | App registers BroadcastReceiver | Realtime samples → 15-min batched push | (manual via Gadgetbridge export, TBD) |
| FITBIT | OAuth2 (in-app browser) | Backend scheduler, every 15 min | Phased 30d→6mo→2yr, resumable |
| STRAVA | OAuth2 (in-app browser) | Backend scheduler, every 15 min | Phased, resumable |
| WHOOP | Email+password form | Backend scheduler, daily 09:00 IST | Phased (poll stub — real ingestion pending) |

## Swagger UI / Kafka UI

- [http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html)
- [http://localhost:8081](http://localhost:8081)
