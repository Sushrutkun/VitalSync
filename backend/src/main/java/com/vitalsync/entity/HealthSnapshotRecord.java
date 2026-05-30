package com.vitalsync.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "health_snapshot_record",
    uniqueConstraints = @UniqueConstraint(name = "uq_snapshot_idempotency_key", columnNames = "idempotency_key"),
    indexes = {
      @Index(name = "idx_snapshot_user_period", columnList = "user_id,period_start"),
      @Index(name = "idx_snapshot_user_created", columnList = "user_id,created_at"),
      @Index(name = "idx_snapshot_user_source_period", columnList = "user_id,source,period_start")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthSnapshotRecord {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false, length = 64)
  private String userId;

  @Column(name = "idempotency_key", nullable = false, unique = true)
  private String idempotencyKey;

  @Enumerated(EnumType.STRING)
  @Column(name = "source", nullable = false, length = 32)
  private HealthSource source;

  @Column(name = "period_start")
  private Instant periodStart;

  @Column(name = "period_end")
  private Instant periodEnd;

  private Double heartRateBpm;
  private Long stepsTotal;
  private Long stepsDelta;
  private Double bloodOxygenPct;
  private Double activeCaloriesKcal;
  private Double distanceMeters;
  private Long heartRateZoneMinutes;
  private Long sleepDurationMinutes;

  @Column(columnDefinition = "text")
  private String exerciseSessionsJson;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;
}
