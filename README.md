# VitalSync

Health data ingestion platform. Android app (Expo/React Native) + Spring Boot backend + Kafka pipeline.

## Architecture

```
Android App (Health Connect)
    → POST /api/v1/health/sync  (JWT-auth)
    → Spring Boot :8083
    → Kafka (vitalsync-data-ingestion)
    → [future: consumer / read store]
```

## Repo Layout

```
VitalSync/
├── frontend/       Expo React Native app (Android)
├── backend/        Spring Boot 3 API (Java 17)
├── k8s/            Kubernetes manifests
├── scripts/        Setup + load-gen utilities
└── docs/           API spec
```

---

## Quick Start

### 1 — Start backend infrastructure

```bash
cd backend
docker compose up -d        # Postgres :5432 · Kafka :9092 · Kafka-UI :8081
```

Wait ~20s for Kafka to be healthy, then:

```bash
./mvnw spring-boot:run      # API on :8083
```

### 2 — Start frontend

See [`frontend/README.md`](frontend/README.md) for device-specific instructions (USB, WiFi, another laptop).

---

## Environment Variables (backend)

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/vitalsync` | Postgres JDBC URL |
| `DB_USER` | `vitalsync` | Postgres user |
| `DB_PASSWORD` | `vitalsync` | Postgres password |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker |
| `JWT_SECRET` | `change-me-in-prod-...` | HS256 key — **change in prod**, min 32 bytes |

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

## Swagger UI

[http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html) — available while backend is running.

## Kafka UI

[http://localhost:8081](http://localhost:8081) — topic browser, consumer group monitor.
