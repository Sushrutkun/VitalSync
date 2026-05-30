package com.vitalsync.dto.sources;

import com.vitalsync.entity.BackfillState.PhaseStatus;
import com.vitalsync.entity.HealthSource;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackfillStatusDto {
  private HealthSource source;
  private Integer phase;
  private PhaseStatus phaseStatus;
  private LocalDate cursorDate;
  private LocalDate targetDate;
  private Integer daysSynced;
  private Integer totalDays;
  private Integer percentComplete;
  private String lastError;
  private Instant updatedAt;
}
