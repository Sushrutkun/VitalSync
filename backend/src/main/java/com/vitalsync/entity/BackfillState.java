package com.vitalsync.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;

/**
 * Phased, resumable backfill state per (user, source, phase).
 *
 * <p>Phase 1 = last 30 days (high resolution, foreground priority).<br>
 * Phase 2 = last 6 months (daily summaries, background).<br>
 * Phase 3 = full history (daily summaries, lowest priority, throttled).
 */
@Entity
@Table(
    name = "backfill_state",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_backfill_user_source_phase",
            columnNames = {"user_id", "source", "phase"}),
    indexes = @Index(name = "idx_backfill_status", columnList = "phase_status"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackfillState {

  public enum PhaseStatus {
    PENDING,
    IN_PROGRESS,
    DONE,
    FAILED
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false, length = 64)
  private String userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "source", nullable = false, length = 32)
  private HealthSource source;

  @Column(name = "phase", nullable = false)
  private Integer phase;

  @Enumerated(EnumType.STRING)
  @Column(name = "phase_status", nullable = false, length = 16)
  private PhaseStatus phaseStatus;

  /** Walks backward from today; updated after each successful chunk fetch. */
  @Column(name = "cursor_date")
  private LocalDate cursorDate;

  @Column(name = "target_date")
  private LocalDate targetDate;

  @Column(name = "total_days")
  private Integer totalDays;

  @Column(name = "days_synced", nullable = false)
  private Integer daysSynced;

  @Column(name = "last_error", columnDefinition = "text")
  private String lastError;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;
}
