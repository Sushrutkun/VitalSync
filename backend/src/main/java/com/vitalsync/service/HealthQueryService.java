package com.vitalsync.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.dto.health.AnalyticsResponseDto;
import com.vitalsync.dto.health.DailySummaryDto;
import com.vitalsync.dto.health.ExerciseSession;
import com.vitalsync.entity.DailySummary;
import com.vitalsync.entity.HealthSnapshotRecord;
import com.vitalsync.repository.DailySummaryRepository;
import com.vitalsync.repository.HealthSnapshotRecordRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
@RequiredArgsConstructor
public class HealthQueryService {

  private final DailySummaryRepository summaryRepo;
  private final HealthSnapshotRecordRepository snapshotRepo;
  private final ObjectMapper objectMapper;

  public DailySummaryDto getSummary(String userId, LocalDate date) {
    DailySummary s =
        summaryRepo
            .findByUserIdAndDate(userId, date)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No health data for " + date));

    List<ExerciseSession> exercises = collectExercises(userId, date);

    return new DailySummaryDto(
        s.getDate(),
        coalesceL(s.getSteps(), 0L),
        coalesceD(s.getDistanceMeters(), 0.0),
        coalesceD(s.getActiveCaloriesKcal(), 0.0),
        coalesceL(s.getHeartRateZoneMinutes(), 0L),
        s.getAvgHeartRateBpm(),
        coalesceD(s.getRestingHeartRateBpm(), 0.0),
        s.getBloodOxygenPct(),
        coalesceL(s.getSleepDurationMinutes(), 0L),
        exercises);
  }

  public AnalyticsResponseDto getAnalytics(String userId, String metric, String range) {
    Instant now = Instant.now();
    Instant from = computeFrom(range, now);

    List<HealthSnapshotRecord> records =
        snapshotRepo.findByUserIdAndPeriodStartBetweenOrderByPeriodStartAsc(userId, from, now);

    Function<HealthSnapshotRecord, Double> extractor = metricExtractor(metric);
    List<AnalyticsResponseDto.DataPoint> points =
        records.stream()
            .map(r -> new AnalyticsResponseDto.DataPoint(r.getPeriodStart(), extractor.apply(r)))
            .filter(p -> p.getValue() != null)
            .collect(Collectors.toList());

    AnalyticsResponseDto.StatsSummary stats = computeStats(points);
    return new AnalyticsResponseDto(metric, range, points, stats);
  }

  private Instant computeFrom(String range, Instant now) {
    return switch (range.toUpperCase()) {
      case "HOUR" -> now.minus(1, ChronoUnit.HOURS);
      case "WEEK" -> now.minus(7, ChronoUnit.DAYS);
      case "MONTH" -> now.minus(30, ChronoUnit.DAYS);
      case "YEAR" -> now.minus(365, ChronoUnit.DAYS);
      default -> now.minus(1, ChronoUnit.DAYS); // DAY
    };
  }

  private Function<HealthSnapshotRecord, Double> metricExtractor(String metric) {
    return switch (metric.toLowerCase()) {
      case "steps" -> r -> r.getStepsTotal() != null ? r.getStepsTotal().doubleValue() : null;
      case "distance" -> HealthSnapshotRecord::getDistanceMeters;
      case "calories" -> HealthSnapshotRecord::getActiveCaloriesKcal;
      case "avghr", "heartrate" -> HealthSnapshotRecord::getHeartRateBpm;
      case "restinghr" -> HealthSnapshotRecord::getHeartRateBpm;
      case "spo2" -> HealthSnapshotRecord::getBloodOxygenPct;
      case "sleep" -> r -> r.getSleepDurationMinutes() != null ? r.getSleepDurationMinutes().doubleValue() : null;
      case "hrzone" -> r -> r.getHeartRateZoneMinutes() != null ? r.getHeartRateZoneMinutes().doubleValue() : null;
      default -> r -> null;
    };
  }

  private AnalyticsResponseDto.StatsSummary computeStats(List<AnalyticsResponseDto.DataPoint> points) {
    if (points.isEmpty()) return new AnalyticsResponseDto.StatsSummary(0.0, 0.0, 0.0, 0.0);
    DoubleSummaryStatistics stats =
        points.stream().mapToDouble(AnalyticsResponseDto.DataPoint::getValue).summaryStatistics();
    double latest = points.get(points.size() - 1).getValue();
    return new AnalyticsResponseDto.StatsSummary(stats.getAverage(), stats.getMin(), stats.getMax(), latest);
  }

  private List<ExerciseSession> collectExercises(String userId, LocalDate date) {
    Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    List<HealthSnapshotRecord> records =
        snapshotRepo.findByUserIdAndPeriodStartBetweenOrderByPeriodStartAsc(userId, dayStart, dayEnd);

    Map<Instant, ExerciseSession> deduped = new LinkedHashMap<>();
    for (HealthSnapshotRecord r : records) {
      if (r.getExerciseSessionsJson() == null || r.getExerciseSessionsJson().isBlank()) continue;
      try {
        List<ExerciseSession> sessions =
            objectMapper.readValue(r.getExerciseSessionsJson(), new TypeReference<>() {});
        for (ExerciseSession s : sessions) {
          deduped.putIfAbsent(s.getStartTime(), s);
        }
      } catch (Exception e) {
        log.warn("Failed to deserialize exercise sessions for record user=[{}]", userId, e);
      }
    }
    return new ArrayList<>(deduped.values());
  }

  private Long coalesceL(Long a, Long b) { return a != null ? a : b; }
  private Double coalesceD(Double a, Double b) { return a != null ? a : b; }
}
