package com.vitalsync.dto.health;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A single exercise session reported by the device for the sync window. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseSession {
    @NotBlank
    String type;

    @NotNull
    Instant startTime;

    @NotNull
    Instant endTime;

    @PositiveOrZero
    int durationMinutes;

    Double calories;
    Double distanceMeters;
    Double avgHeartRateBpm;
}
