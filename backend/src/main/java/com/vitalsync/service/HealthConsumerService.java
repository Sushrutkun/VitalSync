package com.vitalsync.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.dto.health.ExerciseSession;
import com.vitalsync.dto.health.HealthSnapshot;
import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.entity.DailySummary;
import com.vitalsync.entity.HealthSnapshotRecord;
import com.vitalsync.repository.DailySummaryRepository;
import com.vitalsync.repository.HealthSnapshotRecordRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class HealthConsumerService {

  private final HealthSnapshotRecordRepository snapshotRepo;
  private final DailySummaryRepository summaryRepo;
  private final ObjectMapper objectMapper;

  @KafkaListener(
      topics = "${vitalsync.kafka.topic.name}",
      groupId = "${spring.kafka.consumer.group-id}",
      containerFactory = "kafkaListenerContainerFactory")
  @Transactional
  public void consume(
      HealthSyncRequest request, @Header(KafkaHeaders.RECEIVED_KEY) String userId) {
    String idempotencyKey = request.getIdempotencyKey();

    if (snapshotRepo.existsByIdempotencyKey(idempotencyKey)) {
      log.debug("Duplicate snapshot skipped key=[{}]", idempotencyKey);
      return;
    }

    HealthSnapshot snap = request.getSnapshot();
    HealthSnapshotRecord record = buildRecord(request, userId, idempotencyKey, snap);
    snapshotRepo.save(record);

    LocalDate date = request.getPeriodStart().atZone(ZoneOffset.UTC).toLocalDate();
    DailySummary summary =
        summaryRepo
            .findByUserIdAndDate(userId, date)
            .orElseGet(() -> initSummary(userId, date));
    mergeSummary(summary, snap);
    summaryRepo.save(summary);

    log.info(
        "Consumed snapshot user=[{}] key=[{}] date=[{}]", userId, idempotencyKey, date);
  }

  private HealthSnapshotRecord buildRecord(
      HealthSyncRequest request, String userId, String idempotencyKey, HealthSnapshot snap) {
    String exerciseJson = serializeExercises(snap.getExerciseSessions());
    return HealthSnapshotRecord.builder()
        .userId(userId)
        .idempotencyKey(idempotencyKey)
        .periodStart(request.getPeriodStart())
        .periodEnd(request.getPeriodEnd())
        .heartRateBpm(snap.getHeartRateBpm())
        .stepsTotal(snap.getStepsTotal())
        .stepsDelta(snap.getStepsDelta())
        .bloodOxygenPct(snap.getBloodOxygenPct())
        .activeCaloriesKcal(snap.getActiveCaloriesKcal())
        .distanceMeters(snap.getDistanceMeters())
        .heartRateZoneMinutes(snap.getHeartRateZoneMinutes())
        .sleepDurationMinutes(snap.getSleepDurationMinutes())
        .exerciseSessionsJson(exerciseJson)
        .createdAt(Instant.now())
        .build();
  }

  private DailySummary initSummary(String userId, LocalDate date) {
    return DailySummary.builder()
        .userId(userId)
        .date(date)
        .steps(0L)
        .distanceMeters(0.0)
        .activeCaloriesKcal(0.0)
        .heartRateZoneMinutes(0L)
        .heartRateBpmSum(0.0)
        .heartRateCount(0)
        .bloodOxygenSum(0.0)
        .bloodOxygenCount(0)
        .sleepDurationMinutes(0L)
        .updatedAt(Instant.now())
        .build();
  }

  private void mergeSummary(DailySummary s, HealthSnapshot snap) {
    if (snap.getStepsTotal() != null && snap.getStepsTotal() > coalesce(s.getSteps(), 0L))
      s.setSteps(snap.getStepsTotal());

    if (snap.getDistanceMeters() != null && snap.getDistanceMeters() > coalesceD(s.getDistanceMeters(), 0.0))
      s.setDistanceMeters(snap.getDistanceMeters());

    if (snap.getActiveCaloriesKcal() != null && snap.getActiveCaloriesKcal() > coalesceD(s.getActiveCaloriesKcal(), 0.0))
      s.setActiveCaloriesKcal(snap.getActiveCaloriesKcal());

    if (snap.getHeartRateZoneMinutes() != null && snap.getHeartRateZoneMinutes() > coalesce(s.getHeartRateZoneMinutes(), 0L))
      s.setHeartRateZoneMinutes(snap.getHeartRateZoneMinutes());

    if (snap.getHeartRateBpm() != null) {
      s.setHeartRateBpmSum(coalesceD(s.getHeartRateBpmSum(), 0.0) + snap.getHeartRateBpm());
      s.setHeartRateCount(coalesceI(s.getHeartRateCount(), 0) + 1);
      double rhr = coalesceD(s.getRestingHeartRateBpm(), Double.MAX_VALUE);
      if (snap.getHeartRateBpm() < rhr) s.setRestingHeartRateBpm(snap.getHeartRateBpm());
    }

    if (snap.getBloodOxygenPct() != null) {
      s.setBloodOxygenSum(coalesceD(s.getBloodOxygenSum(), 0.0) + snap.getBloodOxygenPct());
      s.setBloodOxygenCount(coalesceI(s.getBloodOxygenCount(), 0) + 1);
    }

    if (snap.getSleepDurationMinutes() != null && snap.getSleepDurationMinutes() > coalesce(s.getSleepDurationMinutes(), 0L))
      s.setSleepDurationMinutes(snap.getSleepDurationMinutes());

    s.setUpdatedAt(Instant.now());
  }

  private String serializeExercises(List<ExerciseSession> sessions) {
    if (sessions == null || sessions.isEmpty()) return "[]";
    try {
      return objectMapper.writeValueAsString(sessions);
    } catch (JsonProcessingException e) {
      log.warn("Failed to serialize exercise sessions", e);
      return "[]";
    }
  }

  private <T extends Comparable<T>> T coalesce(T a, T b) { return a != null ? a : b; }
  private Double coalesceD(Double a, Double b) { return a != null ? a : b; }
  private Integer coalesceI(Integer a, Integer b) { return a != null ? a : b; }
}
