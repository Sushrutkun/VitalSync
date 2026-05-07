package com.vitalsync.dto.user;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * PATCH body for {@code /api/v1/users/me}. All fields nullable; the service applies only the
 * non-null values.
 */
public record UpdateProfileRequest(
    @Size(max = 128) String name,
    LocalDate dateOfBirth,
    BigDecimal heightCm,
    BigDecimal weightKg) {}
