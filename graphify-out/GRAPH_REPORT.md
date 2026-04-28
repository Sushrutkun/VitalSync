# Graph Report - /Users/sushrutda/Desktop/personal/VitalSync  (2026-04-28)

## Corpus Check
- Corpus is ~14,288 words - fits in a single context window. You may not need a graph.

## Summary
- 84 nodes · 98 edges · 12 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Spec & DB Schema|API Spec & DB Schema]]
- [[_COMMUNITY_Health Sync Controller Flow|Health Sync Controller Flow]]
- [[_COMMUNITY_k8s Deployments & Services|k8s Deployments & Services]]
- [[_COMMUNITY_Spring Boot Beans & Config|Spring Boot Beans & Config]]
- [[_COMMUNITY_Global Exception Handling|Global Exception Handling]]
- [[_COMMUNITY_Health Snapshot Pipeline (DTO)|Health Snapshot Pipeline (DTO)]]
- [[_COMMUNITY_Architecture Docs & Endpoints|Architecture Docs & Endpoints]]
- [[_COMMUNITY_Kafka Producer Config|Kafka Producer Config]]
- [[_COMMUNITY_Application Entry Point|Application Entry Point]]
- [[_COMMUNITY_Kafka Topic Config|Kafka Topic Config]]
- [[_COMMUNITY_Jackson Config|Jackson Config]]
- [[_COMMUNITY_OpenAPISwagger Config|OpenAPI/Swagger Config]]

## God Nodes (most connected - your core abstractions)
1. `docs/API.md - API Specification v1` - 12 edges
2. `k8s Namespace: vitalsync` - 6 edges
3. `k8s Deployment: vitalsync-backend` - 6 edges
4. `failure()` - 5 edges
5. `GlobalExceptionHandler` - 5 edges
6. `VitalSyncApplication (Spring Boot entry point)` - 5 edges
7. `HealthSnapshotPublisher (Kafka producer service)` - 5 edges
8. `REST endpoint: POST /api/v1/health/sync` - 5 edges
9. `Kafka topic: vitalsync-data-ingestion` - 5 edges
10. `HealthSyncController (POST /api/v1/health/sync)` - 4 edges

## Surprising Connections (you probably didn't know these)
- `HealthSnapshot DTO` --semantically_similar_to--> `DB table spec: health_snapshots`  [INFERRED] [semantically similar]
  backend/src/main/java/com/vitalsync/dto/HealthSnapshot.java → docs/API.md
- `NewTopic vitalSyncDataTopic bean` --references--> `Kafka topic: vitalsync-data-ingestion`  [INFERRED]
  backend/src/main/java/com/vitalsync/config/KafkaTopicConfig.java → k8s/backend.yaml
- `k8s Deployment: vitalsync-backend` --references--> `VitalSyncApplication (Spring Boot entry point)`  [INFERRED]
  k8s/backend.yaml → backend/src/main/java/com/vitalsync/VitalSyncApplication.java
- `HealthSnapshotPublisher (Kafka producer service)` --references--> `Kafka topic: vitalsync-data-ingestion`  [INFERRED]
  backend/src/main/java/com/vitalsync/service/HealthSnapshotPublisher.java → k8s/backend.yaml
- `DB table spec: exercise_sessions` --shares_data_with--> `ExerciseSession DTO`  [INFERRED]
  docs/API.md → backend/src/main/java/com/vitalsync/dto/ExerciseSession.java

## Hyperedges (group relationships)
- **Health sync request -> controller -> publisher -> Kafka topic** — vitalsync_health_sync_controller, vitalsync_health_snapshot_publisher, vitalsync_kafka_template_bean, vitalsync_kafka_topic_data_ingestion, vitalsync_health_sync_request_dto [EXTRACTED 1.00]
- **Spring bean wiring: ProducerFactory -> KafkaTemplate -> publisher** — vitalsync_kafka_producer_config, vitalsync_producer_factory_bean, vitalsync_kafka_template_bean, vitalsync_health_snapshot_publisher [EXTRACTED 1.00]
- **All k8s workloads collocated in vitalsync namespace** — vitalsync_namespace, vitalsync_backend_deployment, vitalsync_backend_service, vitalsync_kafka_deployment, vitalsync_kafka_service, vitalsync_kafka_ui_deployment, vitalsync_kafka_ui_service [EXTRACTED 1.00]
- **Kafka runtime: backend producer + Redpanda console UI -> kafka broker svc** — vitalsync_backend_deployment, vitalsync_kafka_ui_deployment, vitalsync_kafka_service, vitalsync_kafka_deployment [EXTRACTED 1.00]
- **HealthSnapshot data model spans DTOs, API spec, DB tables** — vitalsync_health_snapshot_dto, vitalsync_exercise_session_dto, vitalsync_db_table_health_snapshots, vitalsync_db_table_exercise_sessions, vitalsync_api_md [INFERRED 0.85]

## Communities

### Community 0 - "API Spec & DB Schema"
Cohesion: 0.18
Nodes (15): docs/API.md - API Specification v1, Concept: Access Token + Refresh Token (ATRT) auth, Concept: Refresh token rotation, DB table spec: exercise_sessions, DB table spec: health_snapshots, DB table spec: refresh_tokens, DB table spec: users, Spec endpoint: GET /api/v1/health/history (+7 more)

### Community 1 - "Health Sync Controller Flow"
Cohesion: 0.18
Nodes (5): HealthSnapshotPublisher, KafkaPublishException, HealthSyncController, accepted(), RuntimeException

### Community 2 - "k8s Deployments & Services"
Cohesion: 0.31
Nodes (10): k8s Deployment: vitalsync-backend, Container image: vitalsync-backend:latest, k8s Service: vitalsync-backend (NodePort 30080), k8s Deployment: kafka (KRaft single-node), Container image: confluentinc/cp-kafka:7.6.1, k8s Service: kafka (ClusterIP 9092), k8s Deployment: kafka-ui (Redpanda Console), Container image: redpanda console:latest (+2 more)

### Community 3 - "Spring Boot Beans & Config"
Cohesion: 0.29
Nodes (8): VitalSyncApplication (Spring Boot entry point), JacksonConfig (scalar-to-string coercion), KafkaProducerConfig (ProducerFactory + KafkaTemplate), KafkaTemplate<String,Object> bean, KafkaTopicConfig (auto-create topic bean), NewTopic vitalSyncDataTopic bean, OpenApiConfig (Swagger metadata), ProducerFactory<String,Object> bean

### Community 4 - "Global Exception Handling"
Cohesion: 0.43
Nodes (2): GlobalExceptionHandler, failure()

### Community 5 - "Health Snapshot Pipeline (DTO)"
Cohesion: 0.38
Nodes (7): GlobalExceptionHandler (RestControllerAdvice), HealthSnapshot DTO, HealthSnapshotPublisher (Kafka producer service), HealthSyncController (POST /api/v1/health/sync), HealthSyncRequest DTO, HealthSyncResponse DTO, KafkaPublishException

### Community 6 - "Architecture Docs & Endpoints"
Cohesion: 0.33
Nodes (7): Backend README (architecture overview), Concept: Health Connect 60s sync window, Concept: idempotency-key dedup, Backend README endpoint: POST /api/v1/data/ingest (stale), REST endpoint: POST /api/v1/health/sync, Kafka topic: vitalsync-data-ingestion, Top-level README.md

### Community 7 - "Kafka Producer Config"
Cohesion: 0.67
Nodes (1): KafkaProducerConfig

### Community 8 - "Application Entry Point"
Cohesion: 0.67
Nodes (1): VitalSyncApplication

### Community 9 - "Kafka Topic Config"
Cohesion: 0.67
Nodes (1): KafkaTopicConfig

### Community 10 - "Jackson Config"
Cohesion: 0.67
Nodes (1): JacksonConfig

### Community 11 - "OpenAPI/Swagger Config"
Cohesion: 0.67
Nodes (1): OpenApiConfig

## Knowledge Gaps
- **11 isolated node(s):** `OpenApiConfig (Swagger metadata)`, `Top-level README.md`, `Concept: idempotency-key dedup`, `Concept: Health Connect 60s sync window`, `Spec endpoint: GET /api/v1/health/summary` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Global Exception Handling`** (7 nodes): `GlobalExceptionHandler.java`, `GlobalExceptionHandler`, `.handleGeneric()`, `.handleKafka()`, `.handleUnreadable()`, `.handleValidation()`, `failure()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Kafka Producer Config`** (4 nodes): `KafkaProducerConfig.java`, `KafkaProducerConfig`, `.kafkaTemplate()`, `.producerFactory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Application Entry Point`** (3 nodes): `VitalSyncApplication.java`, `VitalSyncApplication`, `.main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Kafka Topic Config`** (3 nodes): `KafkaTopicConfig.java`, `KafkaTopicConfig`, `.vitalSyncDataTopic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Jackson Config`** (3 nodes): `JacksonConfig.java`, `JacksonConfig`, `.scalarToStringCoercion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OpenAPI/Swagger Config`** (3 nodes): `OpenApiConfig.java`, `OpenApiConfig`, `.vitalSyncOpenAPI()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `docs/API.md - API Specification v1` connect `API Spec & DB Schema` to `Architecture Docs & Endpoints`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `REST endpoint: POST /api/v1/health/sync` connect `Architecture Docs & Endpoints` to `API Spec & DB Schema`, `Health Snapshot Pipeline (DTO)`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `k8s Deployment: vitalsync-backend` connect `k8s Deployments & Services` to `Spring Boot Beans & Config`, `Architecture Docs & Endpoints`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `failure()` (e.g. with `.handleValidation()` and `.handleUnreadable()`) actually correct?**
  _`failure()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `OpenApiConfig (Swagger metadata)`, `Top-level README.md`, `Concept: idempotency-key dedup` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._