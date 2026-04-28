package com.vitalsync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * Request body for {@code POST /api/v1/health/sync}.
 *
 * <p>The mobile client posts one request per sync window. {@link #idempotencyKey} is generated
 * client-side and used by downstream consumers to deduplicate retries of the same window.
 */
public record HealthSyncRequest(
    @NotBlank String userId,
    @NotBlank String idempotencyKey,
    @NotNull Instant periodStart,
    @NotNull Instant periodEnd,
    @NotNull @Valid HealthSnapshot snapshot) {}
