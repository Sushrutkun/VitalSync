# VitalSync Backend

Spring Boot 3.2.5 (Java 17) REST API for health data ingestion with Apache Kafka integration.

## Architecture

```
Client → POST /api/v1/data/ingest → DataIngestionController → KafkaProducerService → Kafka Topic
```

## API Endpoints

### `POST /api/v1/data/ingest`
Accepts a structured JSON payload and publishes each record to the `vitalsync-data-ingestion` Kafka topic.

**Request:**
```json
{
  "user_id": "u1",
  "records": [
    { "sensorId": "hr-001", "value": 72, "unit": "bpm" },
    { "sensorId": "bp-002", "systolic": 120, "diastolic": 80 }
  ],
  "cursor": "hc_token"
}
```

| Field      | Type           | Required | Description                        |
|------------|----------------|----------|------------------------------------|
| `user_id`  | `string`       | ✅        | User identifier (used as Kafka key)|
| `records`  | `List<Object>` | ✅        | Array of data objects to ingest    |
| `cursor`   | `string`       | ❌        | Pagination/sync cursor token       |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All records published to Kafka successfully",
  "totalRecords": 2,
  "publishedRecords": 2,
  "failedRecords": 0,
  "timestamp": "2026-04-23T12:00:00Z",
  "errors": null
}
```

### `GET /api/v1/data/health`
Health check for the ingestion service.

## Documentation (Swagger UI)
When the application is running, you can access the interactive API documentation at:
[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

## Prerequisites

- Java 17+
- Apache Kafka running on `localhost:9092` (or set `KAFKA_BOOTSTRAP_SERVERS` env var)

## Running

```bash
# Start Kafka first (e.g., via Docker)
docker run -d --name kafka -p 9092:9092 apache/kafka:latest

# Build and run
./mvnw spring-boot:run
```

## Authentication

ATRT (Access Token + Refresh Token). See `docs/API.md` §2 + §4.0–§4.3 for spec.

| Token | Lifetime | Storage |
|---|---|---|
| `accessToken` | 24h | JWT HS256, stateless |
| `refreshToken` | 180 days (~6 months) | bcrypt-hashed in `refresh_tokens` table; rotated on every `/auth/refresh` |

Endpoints:

- `POST /api/v1/auth/signup` — create account, returns `{accessToken, refreshToken, user}`
- `POST /api/v1/auth/login` — same response shape
- `POST /api/v1/auth/refresh` — submit current refresh token, get new pair (old one is invalidated)
- `POST /api/v1/auth/logout` — requires `Authorization: Bearer <accessToken>`, deletes the submitted refresh token row

All non-auth endpoints (e.g. `/api/v1/health/sync`) require `Authorization: Bearer <accessToken>`. The controller also enforces `userId` in the request body matches the JWT `sub` (returns `403 FORBIDDEN` otherwise).

## Configuration

| Env Variable             | Default                     | Description            |
|--------------------------|-----------------------------|------------------------|
| `KAFKA_BOOTSTRAP_SERVERS`| `localhost:9092`            | Kafka broker addresses |
| `KAFKA_TOPIC_NAME`       | `vitalsync-data-ingestion`  | Target Kafka topic     |
| `DB_URL`                 | `jdbc:postgresql://localhost:5432/vitalsync` | Postgres JDBC URL |
| `DB_USER`                | `vitalsync`                 | Postgres user          |
| `DB_PASSWORD`            | `vitalsync`                 | Postgres password      |
| `JWT_SECRET`             | _none — required in prod_   | HS256 signing key, ≥32 bytes (`openssl rand -hex 32`) |

## Project Structure

```
src/main/java/com/vitalsync/
├── VitalSyncApplication.java          # Entry point
├── config/
│   ├── KafkaProducerConfig.java       # Producer factory & template
│   └── KafkaTopicConfig.java          # Auto-create topic on startup
├── controller/
│   └── DataIngestionController.java   # REST endpoint
├── dto/
│   └── ApiResponse.java               # Standardized response
├── exception/
│   └── GlobalExceptionHandler.java    # Error handling
└── service/
    └── KafkaProducerService.java      # Kafka publish logic
```
