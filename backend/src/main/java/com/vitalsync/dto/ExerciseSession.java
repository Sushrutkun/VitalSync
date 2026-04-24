package com.vitalsync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;

/**
 * A single exercise session reported by the device for the sync window.
 */
public record ExerciseSession(
        @NotBlank String type,
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        @PositiveOrZero int durationMinutes,
        Double calories,
        Double distanceMeters,
        Double avgHeartRateBpm
) {
}