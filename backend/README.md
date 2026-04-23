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

## Configuration

| Env Variable             | Default                     | Description            |
|--------------------------|-----------------------------|------------------------|
| `KAFKA_BOOTSTRAP_SERVERS`| `localhost:9092`            | Kafka broker addresses |
| `KAFKA_TOPIC_NAME`       | `vitalsync-data-ingestion`  | Target Kafka topic     |

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
