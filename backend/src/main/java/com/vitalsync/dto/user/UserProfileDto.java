package com.vitalsync.dto.user;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    String id;
    String email;
    String name;
    LocalDate dateOfBirth;
    BigDecimal heightCm;
    BigDecimal weightKg;
    Instant createdAt;
}
