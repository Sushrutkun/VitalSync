package com.vitalsync.auth.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(
    name = "users",
    indexes = {@Index(name = "idx_users_email", columnList = "email", unique = true)})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  @Id
  @Column(length = 64)
  private String id;

  @Column(nullable = false, unique = true, length = 254)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String name;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(name = "height_cm", precision = 5, scale = 1)
  private BigDecimal heightCm;

  @Column(name = "weight_kg", precision = 5, scale = 2)
  private BigDecimal weightKg;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PrePersist
  void onInsert() {
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
