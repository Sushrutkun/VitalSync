package com.vitalsync.controller;

import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.dto.health.HealthSyncResponse;
import com.vitalsync.exception.AuthErrorCode;
import com.vitalsync.exception.AuthException;
import com.vitalsync.service.HealthSnapshotPublisher;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Sync", description = "Mobile clients post Health Connect snapshots here")
@Slf4j
public class HealthSyncController {

  @Autowired private HealthSnapshotPublisher publisher;

  /** Accepts one health snapshot per call and queues it for downstream processing. */
  @PostMapping("/sync")
  @Operation(
      summary = "Sync a health snapshot",
      description =
          "Publishes the snapshot to Kafka, keyed by userId, with the idempotencyKey as a header.")
  public ResponseEntity<HealthSyncResponse> sync(
      Authentication authentication, @Valid @RequestBody HealthSyncRequest request) {
    String authUserId = authentication != null ? authentication.getName() : null;
    if (authUserId == null || !authUserId.equals(request.getUserId())) {
      throw new AuthException(
          AuthErrorCode.FORBIDDEN, "userId in body does not match authenticated user");
    }

    log.info(
        "Health sync received user=[{}] idempotencyKey=[{}] window=[{} -> {}]",
        request.getUserId(),
        request.getIdempotencyKey(),
        request.getPeriodStart(),
        request.getPeriodEnd());

    publisher.publish(request);

    return ResponseEntity.accepted().body(HealthSyncResponse.accepted(request.getIdempotencyKey()));
  }
}
