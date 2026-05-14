package com.vitalsync.dto.health;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregated health metrics for a sync window. All numeric metrics are nullable because Health
 * Connect may not return data for every metric on every poll.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthSnapshot {
    @NotNull
    Instant timestamp;

    @NotNull
    Instant periodStart;

    @NotNull
    Instant periodEnd;

    Double heartRateBpm;
    Long stepsTotal;
    Long stepsDelta;
    Double bloodOxygenPct;
    Double activeCaloriesKcal;
    Double distanceMeters;
    Long heartRateZoneMinutes;

    @Valid
    List<ExerciseSession> exerciseSessions;
}
