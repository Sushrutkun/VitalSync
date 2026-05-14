package com.vitalsync.dto.health;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for {@code POST /api/v1/health/sync}.
 *
 * <p>The mobile client posts one request per sync window. {@link #idempotencyKey} is generated
 * client-side and used by downstream consumers to deduplicate retries of the same window.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthSyncRequest {
    @NotBlank
    String userId;

    @NotBlank
    String idempotencyKey;

    @NotNull
    Instant periodStart;

    @NotNull
    Instant periodEnd;

    @NotNull @Valid
    HealthSnapshot snapshot;
}
