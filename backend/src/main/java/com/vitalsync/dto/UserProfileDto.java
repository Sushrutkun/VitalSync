package com.vitalsync.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record UserProfileDto(
    String id,
    String email,
    String name,
    LocalDate dateOfBirth,
    BigDecimal heightCm,
    BigDecimal weightKg,
    Instant createdAt) {}
