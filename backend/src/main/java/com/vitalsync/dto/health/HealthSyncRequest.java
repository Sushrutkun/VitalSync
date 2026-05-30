package com.vitalsync.dto.health;

import com.vitalsync.entity.HealthSource;
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
 * {@link #source} identifies the originating system; defaults to HEALTH_CONNECT for older
 * app builds that pre-date multi-source support.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthSyncRequest {
  @NotBlank String userId;

  @NotBlank String idempotencyKey;

  HealthSource source;

  @NotNull Instant periodStart;

  @NotNull Instant periodEnd;

  @NotNull @Valid HealthSnapshot snapshot;

  public HealthSource resolveSource() {
    return source != null ? source : HealthSource.HEALTH_CONNECT;
  }
}
