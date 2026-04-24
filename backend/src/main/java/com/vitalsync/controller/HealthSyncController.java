package com.vitalsync.controller;

import com.vitalsync.dto.HealthSyncRequest;
import com.vitalsync.dto.HealthSyncResponse;
import com.vitalsync.service.HealthSnapshotPublisher;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Sync", description = "Mobile clients post Health Connect snapshots here")
@RequiredArgsConstructor
@Slf4j
public class HealthSyncController {

    private final HealthSnapshotPublisher publisher;

    /**
     * Accepts one health snapshot per call and queues it for downstream processing.
     */
    @PostMapping("/sync")
    @Operation(summary = "Sync a health snapshot",
            description = "Publishes the snapshot to Kafka, keyed by userId, with the idempotencyKey as a header.")
    public ResponseEntity<HealthSyncResponse> sync(@Valid @RequestBody HealthSyncRequest request) {
        log.info("Health sync received user=[{}] idempotencyKey=[{}] window=[{} -> {}]",
                request.userId(),
                request.idempotencyKey(),
                request.periodStart(),
                request.periodEnd());

        publisher.publish(request);
        return ResponseEntity.accepted().body(HealthSyncResponse.accepted(request.idempotencyKey()));
    }
}
