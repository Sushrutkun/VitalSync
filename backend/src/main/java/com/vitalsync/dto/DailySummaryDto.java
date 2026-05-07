package com.vitalsync.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Aggregated daily summary returned by {@code GET /api/v1/health/summary}. Field names match the
 * frontend {@code DailySummary} contract exactly.
 */
public record DailySummaryDto(
    LocalDate date,
    long steps,
    double distanceMeters,
    double activeCaloriesKcal,
    long heartRateZoneMinutes,
    double avgHeartRateBpm,
    double restingHeartRateBpm,
    double bloodOxygenPct,
    long sleepDurationMinutes,
    List<ExerciseSession> exerciseSessions) {}
