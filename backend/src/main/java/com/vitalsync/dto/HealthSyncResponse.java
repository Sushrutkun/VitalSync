package com.vitalsync.dto;

import java.time.Instant;
import java.util.List;

/** Response for {@code POST /api/v1/health/sync}. */
public record HealthSyncResponse(
    boolean success,
    String message,
    String idempotencyKey,
    Instant timestamp,
    List<String> errors) {

  public static HealthSyncResponse accepted(String idempotencyKey) {
    return new HealthSyncResponse(
        true,
        "Snapshot accepted and queued for processing",
        idempotencyKey,
        Instant.now(),
        List.of());
  }

  public static HealthSyncResponse failure(String message, List<String> errors) {
    return new HealthSyncResponse(false, message, null, Instant.now(), errors);
  }
}
