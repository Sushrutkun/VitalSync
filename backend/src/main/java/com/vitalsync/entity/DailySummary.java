package com.vitalsync.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "daily_summary",
    uniqueConstraints = @UniqueConstraint(name = "uq_daily_summary_user_date", columnNames = {"user_id", "date"}),
    indexes = @Index(name = "idx_daily_summary_user_date", columnList = "user_id,date"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySummary {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false, length = 64)
  private String userId;

  @Column(nullable = false)
  private LocalDate date;

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
