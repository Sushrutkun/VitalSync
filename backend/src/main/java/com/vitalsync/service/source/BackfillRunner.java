package com.vitalsync.service.source;

import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.dto.sources.BackfillStatusDto;
import com.vitalsync.entity.BackfillState;
import com.vitalsync.entity.BackfillState.PhaseStatus;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.repository.BackfillStateRepository;
import com.vitalsync.service.HealthSnapshotPublisher;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Phased, resumable historical backfill engine.
 *
 * <pre>
 *   Phase 1 → last 30 days   (foreground)
 *   Phase 2 → last 6 months  (background)
 *   Phase 3 → last 2 years   (background, throttled)
 * </pre>
 *
 * Each phase walks the cursor backward day-by-day in {@link #CHUNK_DAYS}-day chunks,
 * checkpointing after each successful chunk so app restarts resume from cursor_date.
 */
@Service
@Slf4j
public class BackfillRunner {

  /** Days per backfill chunk. Smaller = finer checkpoints, more requests. */
  static final int CHUNK_DAYS = 7;

  /** Throttle for Phase 3 (Fitbit 150 req/hr → ~12s/day at 2 req/day is safe). */
  static final long PHASE3_DELAY_MS = 1500;

  private final BackfillStateRepository stateRepo;
  private final HealthSnapshotPublisher publisher;
  private final Map<HealthSource, SourceAdapter> adapters;

  public BackfillRunner(
      BackfillStateRepository stateRepo,
      HealthSnapshotPublisher publisher,
      List<SourceAdapter> adapterList) {
    this.stateRepo = stateRepo;
    this.publisher = publisher;
    Map<HealthSource, SourceAdapter> map = new EnumMap<>(HealthSource.class);
    for (SourceAdapter a : adapterList) map.put(a.source(), a);
    this.adapters = map;
  }

  /** On boot, resume any phases left IN_PROGRESS from a prior run. */
  @PostConstruct
  public void resumeInFlight() {
    List<BackfillState> stuck = stateRepo.findAllByPhaseStatus(PhaseStatus.IN_PROGRESS);
    for (BackfillState s : stuck) {
      log.info("Resuming backfill user=[{}] source=[{}] phase=[{}] cursor=[{}]",
          s.getUserId(), s.getSource(), s.getPhase(), s.getCursorDate());
      runPhaseAsync(s.getUserId(), s.getSource(), s.getPhase());
    }
  }

  /** Triggers (or resumes) a backfill phase. Idempotent. */
  @Transactional
  public BackfillState start(String userId, HealthSource source, int phase) {
    if (!adapters.containsKey(source)) {
      throw new ResponseStatusException(
          HttpStatus.NOT_IMPLEMENTED, "No adapter for source " + source);
    }
    int daysBack = daysBackForPhase(phase);
    LocalDate today = LocalDate.now();
    LocalDate target = today.minusDays(daysBack);

    BackfillState state =
        stateRepo
            .findByUserIdAndSourceAndPhase(userId, source, phase)
            .orElseGet(() ->
                BackfillState.builder()
                    .userId(userId)
                    .source(source)
                    .phase(phase)
                    .phaseStatus(PhaseStatus.PENDING)
                    .cursorDate(today)
                    .targetDate(target)
                    .totalDays(daysBack)
                    .daysSynced(0)
                    .updatedAt(Instant.now())
                    .build());

    // Reset target if a previously-DONE phase is re-run
    if (state.getPhaseStatus() == PhaseStatus.DONE) {
      state.setPhaseStatus(PhaseStatus.PENDING);
      state.setCursorDate(today);
      state.setTargetDate(target);
      state.setDaysSynced(0);
      state.setLastError(null);
    }
    state.setUpdatedAt(Instant.now());
    stateRepo.save(state);

    runPhaseAsync(userId, source, phase);
    return state;
  }

  public BackfillStatusDto status(String userId, HealthSource source, int phase) {
    BackfillState s =
        stateRepo
            .findByUserIdAndSourceAndPhase(userId, source, phase)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No backfill state"));
    int total = s.getTotalDays() != null && s.getTotalDays() > 0 ? s.getTotalDays() : 1;
    int pct = Math.min(100, (s.getDaysSynced() * 100) / total);
    return BackfillStatusDto.builder()
        .source(s.getSource())
        .phase(s.getPhase())
        .phaseStatus(s.getPhaseStatus())
        .cursorDate(s.getCursorDate())
        .targetDate(s.getTargetDate())
        .daysSynced(s.getDaysSynced())
        .totalDays(s.getTotalDays())
        .percentComplete(pct)
        .lastError(s.getLastError())
        .updatedAt(s.getUpdatedAt())
        .build();
  }

  @Async
  public void runPhaseAsync(String userId, HealthSource source, int phase) {
    runPhase(userId, source, phase);
  }

  void runPhase(String userId, HealthSource source, int phase) {
    SourceAdapter adapter = adapters.get(source);
    if (adapter == null) return;

    BackfillState state =
        stateRepo.findByUserIdAndSourceAndPhase(userId, source, phase).orElse(null);
    if (state == null) return;

    setStatus(state, PhaseStatus.IN_PROGRESS, null);
    log.info("Backfill start user=[{}] source=[{}] phase=[{}] cursor=[{}] target=[{}]",
        userId, source, phase, state.getCursorDate(), state.getTargetDate());

    LocalDate cursor = state.getCursorDate();
    LocalDate target = state.getTargetDate();

    while (cursor != null && cursor.isAfter(target)) {
      LocalDate chunkEnd = cursor;
      LocalDate chunkStart = cursor.minusDays(CHUNK_DAYS - 1L);
      if (chunkStart.isBefore(target)) chunkStart = target;

      try {
        List<HealthSyncRequest> reqs = adapter.fetchBackfillChunk(userId, chunkStart, chunkEnd);
        for (HealthSyncRequest req : reqs) {
          req.setIdempotencyKey(source.name() + ":" + req.getIdempotencyKey());
          publisher.publish(req);
        }
        int daysInChunk = (int) (chunkEnd.toEpochDay() - chunkStart.toEpochDay() + 1);
        state.setDaysSynced(state.getDaysSynced() + daysInChunk);
        state.setCursorDate(chunkStart.minusDays(1));
        state.setUpdatedAt(Instant.now());
        stateRepo.save(state);

        if (phase == 3) {
          try { Thread.sleep(PHASE3_DELAY_MS); } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            break;
          }
        }
        cursor = state.getCursorDate();
      } catch (Exception e) {
        log.warn("Backfill chunk failed user=[{}] source=[{}] phase=[{}] chunk=[{}..{}]: {}",
            userId, source, phase, chunkStart, chunkEnd, e.getMessage());
        setStatus(state, PhaseStatus.FAILED, e.getMessage());
        return;
      }
    }

    setStatus(state, PhaseStatus.DONE, null);
    log.info("Backfill done user=[{}] source=[{}] phase=[{}]", userId, source, phase);
  }

  private void setStatus(BackfillState s, PhaseStatus status, String error) {
    s.setPhaseStatus(status);
    s.setLastError(error);
    s.setUpdatedAt(Instant.now());
    stateRepo.save(s);
  }

  private static int daysBackForPhase(int phase) {
    return switch (phase) {
      case 1 -> 30;
      case 2 -> 180;
      case 3 -> 730;
      default -> throw new IllegalArgumentException("Phase must be 1, 2, or 3");
    };
  }
}
