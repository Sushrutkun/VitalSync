# loadgen — VitalSync HTTP synthetic load generator

Pumps realistic synthetic health snapshots through `POST /api/v1/health/sync`,
which lands one Kafka record per call on `vitalsync-data-ingestion`. Use it to
populate Kafka with an analytics-grade dataset (steps that climb during the day
and reset at midnight, heart rate that varies smoothly, exercise sessions tied
to morning routines).

Pure Go stdlib — no external dependencies.

## Build

```bash
cd scripts/loadgen
go build -o bin/loadgen ./cmd/loadgen
```

## Quick run

```bash
# Backend up + Postgres + Kafka
docker compose -f ../../backend/docker-compose.yml up -d
( cd ../../backend && mvn spring-boot:run ) &

# Sanity-check generator (no HTTP)
./bin/loadgen --users=2 --days=1 --dry-run

# Full default run: 1000 users * 30 days * 24 windows = 720_000 messages
./bin/loadgen
```

## Flags

| Flag | Env | Default | Notes |
|---|---|---|---|
| `--base-url` | `BASE_URL` | `http://localhost:8083` | backend base |
| `--users` | `USERS` | `1000` | distinct synthetic accounts |
| `--days` | `DAYS` | `30` | backfill window |
| `--window-minutes` | `WINDOW_MINUTES` | `60` | snapshot cadence |
| `--concurrency` | `CONCURRENCY` | `100` | max in-flight HTTP requests |
| `--request-timeout` | `REQUEST_TIMEOUT` | `10s` | per-request deadline |
| `--dry-run` | `DRY_RUN` | `false` | print first 5 snapshots/user, skip HTTP |

Total messages = `users × days × (1440 / window-minutes)`.

## Realism model

- **Personas** (assigned by `userIndex % 3`): Sedentary / Active / Athlete with
  distinct daily-step targets, resting HR, and morning-exercise routines.
- **Steps**: monotonic accumulator per `(userId, calendar-date)`. Resets at
  midnight. Diurnal weights skew steps toward 09:00–21:00.
- **Heart rate**: clamped to **80–150 bpm**. Sinusoidal diurnal curve + small
  Gaussian jitter + exercise boost.
- **Distance/calories**: derived from steps (stride 0.762 m, 0.04 kcal/step).
- **SpO2**: ~97 ± 0.6, clamped 94–100.
- **Exercise sessions**: morning routines (Athlete: 06:30 RUN, Active: 07:00 WALK).

## Verify Kafka

```bash
docker exec -it vitalsync-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic vitalsync-data-ingestion \
  --from-beginning --max-messages 10
```
