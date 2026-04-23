package com.vitalsync.controller;

import com.vitalsync.dto.ApiResponse;
import com.vitalsync.dto.DataIngestionRequest;
import com.vitalsync.service.KafkaProducerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/data")
@Tag(name = "Data Ingestion", description = "Endpoints for ingesting health data into the system")
public class DataIngestionController {

    private static final Logger log = LoggerFactory.getLogger(DataIngestionController.class);

    private final KafkaProducerService kafkaProducerService;

    public DataIngestionController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    /**
     * POST /api/v1/data/ingest
     *
     * Accepts a structured payload with user_id, records, and cursor.
     * Each record is published to a Kafka topic for post-processing.
     *
     * Example request body:
     * {
     *   "user_id": "u1",
     *   "records": [
     *     { "sensorId": "hr-001", "value": 72, "unit": "bpm" },
     *     { "sensorId": "bp-002", "systolic": 120, "diastolic": 80 }
     *   ],
     *   "cursor": "hc_token"
     * }
     *
     * @param request the data ingestion request payload
     * @return ApiResponse with publish statistics
     */
    @PostMapping("/ingest")
    @Operation(summary = "Ingest data", description = "Accepts user records and pushes them to Kafka for processing")
    public ResponseEntity<ApiResponse> ingestData(@RequestBody DataIngestionRequest request) {
        log.info("Received data ingestion request from user [{}] with {} records, cursor [{}]",
                request.getUserId(),
                request.getRecords() != null ? request.getRecords().size() : 0,
                request.getCursor());

        // Validate user_id
        if (request.getUserId() == null || request.getUserId().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("'user_id' is required and cannot be empty", null));
        }

        // Validate records
        if (request.getRecords() == null || request.getRecords().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("'records' must contain at least one record", null));
        }

        try {
            ApiResponse response = kafkaProducerService.publishData(request);

            HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.PARTIAL_CONTENT;
            return ResponseEntity.status(status).body(response);
        } catch (Exception e) {
            log.error("Unexpected error during data ingestion for user [{}]: {}",
                    request.getUserId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Internal server error during data ingestion",
                            List.of(e.getMessage())));
        }
    }

    /**
     * GET /api/v1/data/health
     * Simple health check for the ingestion endpoint.
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Checks if the ingestion service is running")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("VitalSync Data Ingestion API is running");
    }
}
