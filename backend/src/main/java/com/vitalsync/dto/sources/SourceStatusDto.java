package com.vitalsync.dto.sources;

import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential.Status;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SourceStatusDto {
  private HealthSource source;
  private Status status;
  private Instant connectedAt;
  private Instant lastPolledAt;
  private boolean supportsBackfill;
  private String lastError;
  /** True for cloud sources polled by the backend (Fitbit, Strava, WHOOP). */
  private boolean cloudPolled;
}
