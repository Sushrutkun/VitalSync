package com.vitalsync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

/**
 * Aggregated health metrics for a sync window. All numeric metrics are nullable
 * because Health Connect may not return data for every metric on every poll.
 */
public record HealthSnapshot(
        @NotNull Instant timestamp,
        @NotNull Instant periodStart,
        @NotNull Instant periodEnd,
        Double heartRateBpm,
        Long stepsTotal,
        Long stepsDelta,
        Double bloodOxygenPct,
        Double activeCaloriesKcal,
        @Valid List<ExerciseSession> exerciseSessions
) {
}