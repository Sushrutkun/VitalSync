package com.vitalsync.dto.health;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response for {@code POST /api/v1/health/sync}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthSyncResponse {
    boolean success;
    String message;
    String idempotencyKey;
    Instant timestamp;
    List<String> errors;

    public static HealthSyncResponse accepted(String idempotencyKey) {
        HealthSyncResponse resp = new HealthSyncResponse();
        resp.setSuccess(true);
        resp.setMessage("Snapshot accepted and queued for processing");
        resp.setIdempotencyKey(idempotencyKey);
        resp.setTimestamp(Instant.now());
        resp.setErrors(List.of());
        return resp;
    }

    public static HealthSyncResponse failure(String message, List<String> errors) {
        HealthSyncResponse resp = new HealthSyncResponse();
        resp.setSuccess(false);
        resp.setMessage(message);
        resp.setIdempotencyKey(null);
        resp.setTimestamp(Instant.now());
        resp.setErrors(errors);
        return resp;
    }
}
