# VitalSync Backend

Spring Boot 3 REST API (Java 17). Handles auth, health data ingestion, and Kafka publishing.

**Port**: `8083`  
**Swagger UI**: [http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html)

---

## Prerequisites

| Tool | Version |
|---|---|
| Java / JDK | 17+ |
| Docker + Docker Compose | any recent |
| Maven | bundled via `./mvnw` |

---

## Quick Start

### Step 1 — Start infrastructure

```bash
cd backend
docker compose up -d
```

This starts:
| Service | Port | Description |
|---|---|---|
| Postgres | `5432` | Primary database |
| Kafka | `9092` | Message broker |
| Zookeeper | `2181` | Kafka coordinator |
| Kafka UI | `8081` | Topic browser at [localhost:8081](http://localhost:8081) |

Wait ~20 seconds for Kafka to become healthy:

```bash
docker compose ps       # all should show "healthy" or "running"
```

### Step 2 — Configure environment (optional)

Defaults work out of the box for local dev. To override, export before running:

```bash
export JWT_SECRET=$(openssl rand -hex 32)   # recommended — change from default
export DB_URL=jdbc:postgresql://localhost:5432/vitalsync
export DB_USER=vitalsync
export DB_PASSWORD=vitalsync
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

Or create a `.env` file and source it:

```bash
# backend/.env  (not committed)
JWT_SECRET=your-secret-here
```

### Step 3 — Run

```bash
./mvnw spring-boot:run
```

Backend starts on `:8083`. Schema auto-migrates via Hibernate (`ddl-auto: update`).

---

## Running on Another Laptop

```bash
git clone <repo-url>
cd VitalSync/backend

# Start infra
docker compose up -d

# Run
./mvnw spring-boot:run
```

No extra setup needed. Default env vars in `application.yml` point to the Docker services.

To expose the backend to devices on the same LAN, it already binds to `0.0.0.0:8083` — no extra config needed. Devices on the same network can reach it at `http://<this-laptop-IP>:8083`.

---

## Running via Docker (fully containerised)

```bash
cd backend
docker compose up -d --build
```

This builds the backend image and starts everything together. Backend is on `:8083`.

> Note: with this setup, `JWT_SECRET` in `docker-compose.yml` is `change-me-in-prod-...` — override it for any real usage.

---

## Authentication

ATRT (Access Token + Refresh Token) — JWT HS256, stateless.

| Token | Lifetime | Notes |
|---|---|---|
| `accessToken` | 24h | Bearer token for all API calls |
| `refreshToken` | 180 days | bcrypt-hashed in DB, rotated on every refresh |

**Auth endpoints** (no token required):

```
POST /api/v1/auth/signup    { email, password, name }  →  { accessToken, refreshToken, user }
POST /api/v1/auth/login     { email, password }         →  { accessToken, refreshToken, user }
POST /api/v1/auth/refresh   { refreshToken }            →  { accessToken, refreshToken, user }
POST /api/v1/auth/logout    Authorization: Bearer <token>
```

All other endpoints require `Authorization: Bearer <accessToken>`.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login |
| POST | `/api/v1/auth/refresh` | No | Rotate tokens |
| POST | `/api/v1/auth/logout` | Yes | Invalidate refresh token |
| POST | `/api/v1/health/sync` | Yes | Ingest Health Connect snapshot |
| GET | `/api/v1/health/summary` | Yes | Daily summary (stub — returns zeros) |
| GET | `/api/v1/health/history` | Yes | Snapshot history (stub — returns empty) |
| GET | `/actuator/health` | No | Service health check |

> **Stub note**: `/health/summary` and `/health/history` return zeroed/empty payloads until a read-store consumer is implemented.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/vitalsync` | Postgres JDBC URL |
| `DB_USER` | `vitalsync` | Postgres username |
| `DB_PASSWORD` | `vitalsync` | Postgres password |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address |
| `KAFKA_TOPIC_NAME` | `vitalsync-data-ingestion` | Ingestion topic |
| `JWT_SECRET` | `change-me-in-prod-...` | HS256 signing key — **must change in prod**, min 32 bytes (`openssl rand -hex 32`) |

---

## Project Structure

```
src/main/java/com/vitalsync/
├── VitalSyncApplication.java
├── config/
│   ├── SecurityConfig.java         JWT filter, CORS, permitAll list
│   ├── JwtAuthFilter.java          Token validation per request
│   ├── KafkaProducerConfig.java
│   ├── KafkaTopicConfig.java
│   ├── JacksonConfig.java
│   └── OpenApiConfig.java
├── controller/
│   ├── AuthController.java         signup / login / refresh / logout
│   ├── HealthSyncController.java   POST /health/sync → Kafka
│   └── HealthQueryController.java  GET /health/summary|history (stub)
├── dto/                            Request/response DTOs
├── entity/                         JPA entities (User, RefreshToken, HealthSnapshot)
├── repository/                     Spring Data repos
├── service/                        Business logic
└── exception/                      Global exception handler
```

---

## Useful Commands

```bash
# Check all services healthy
docker compose ps

# Kafka UI (topic browser)
open http://localhost:8081

# Swagger UI
open http://localhost:8083/swagger-ui/index.html

# Backend health
curl http://localhost:8083/actuator/health

# Stop all infra
docker compose down

# Stop + wipe data volumes
docker compose down -v

# Backend logs only
./mvnw spring-boot:run 2>&1 | grep -v "^$"
```
