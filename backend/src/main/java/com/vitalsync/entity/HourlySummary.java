package com.vitalsync.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "hourly_summary",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_hourly_summary_user_bucket",
            columnNames = {"user_id", "hour_bucket"}),
    indexes =
        @Index(
            name = "idx_hourly_summary_user_bucket",
            columnList = "user_id,hour_bucket"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HourlySummary {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false, length = 64)
  private String userId;

  /** UTC instant truncated to the hour (e.g. 2026-05-31T14:00:00Z). */
  @Column(name = "hour_bucket", nullable = false)
  private Instant hourBucket;

  private Long steps;
  private Double distanceMeters;
  private Double activeCaloriesKcal;
  private Long heartRateZoneMinutes;
  private Double heartRateBpmSum;
  private Integer heartRateCount;
  private Double restingHeartRateBpm;
  private Double bloodOxygenSum;
  private Integer bloodOxygenCount;
  private Long sleepDurationMinutes;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public double getAvgHeartRateBpm() {
    return (heartRateCount != null && heartRateCount > 0 && heartRateBpmSum != null)
        ? heartRateBpmSum / heartRateCount
        : 0.0;
  }

  public double getBloodOxygenPct() {
    return (bloodOxygenCount != null && bloodOxygenCount > 0 && bloodOxygenSum != null)
        ? bloodOxygenSum / bloodOxygenCount
        : 0.0;
  }
}
