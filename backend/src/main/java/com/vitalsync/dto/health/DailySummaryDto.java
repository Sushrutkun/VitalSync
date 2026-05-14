package com.vitalsync.dto.health;

import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregated daily summary returned by {@code GET /api/v1/health/summary}. Field names match the
 * frontend {@code DailySummary} contract exactly.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryDto {
    LocalDate date;
    long steps;
    double distanceMeters;
    double activeCaloriesKcal;
    long heartRateZoneMinutes;
    double avgHeartRateBpm;
    double restingHeartRateBpm;
    double bloodOxygenPct;
    long sleepDurationMinutes;
    List<ExerciseSession> exerciseSessions;
}
