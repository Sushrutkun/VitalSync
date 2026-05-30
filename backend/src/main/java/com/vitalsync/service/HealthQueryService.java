package com.vitalsync.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.dto.health.AnalyticsResponseDto;
import com.vitalsync.dto.health.DailySummaryDto;
import com.vitalsync.dto.health.ExerciseSession;
import com.vitalsync.entity.DailySummary;
import com.vitalsync.entity.HealthSnapshotRecord;
import com.vitalsync.entity.HourlySummary;
import com.vitalsync.repository.DailySummaryRepository;
import com.vitalsync.repository.HealthSnapshotRecordRepository;
import com.vitalsync.repository.HourlySummaryRepository;
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
  private final HourlySummaryRepository hourlyRepo;
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

  /**
   * Routes analytics queries to the appropriate pre-aggregation table:
   *   HOUR  → raw health_snapshot_record (~4 points at 15-min resolution)
   *   DAY   → hourly_summary (24 hourly buckets)
   *   WEEK  → daily_summary (7 daily points)
   *   MONTH → daily_summary (30 daily points)
   *   YEAR  → daily_summary (365 daily points)
   */
  public AnalyticsResponseDto getAnalytics(String userId, String metric, String range) {
    Instant now = Instant.now();
    LocalDate today = LocalDate.now(ZoneOffset.UTC);

    List<AnalyticsResponseDto.DataPoint> points =
        switch (range.toUpperCase()) {
          case "HOUR" ->
              fromSnapshots(userId, now.minus(1, ChronoUnit.HOURS), now, metric);
          case "DAY" ->
              fromHourly(userId, now.minus(24, ChronoUnit.HOURS), now, metric);
          case "WEEK" ->
              fromDaily(userId, today.minusDays(7), today, metric);
          case "MONTH" ->
              fromDaily(userId, today.minusDays(30), today, metric);
          case "YEAR" ->
              fromDaily(userId, today.minusDays(365), today, metric);
          default ->
              fromHourly(userId, now.minus(24, ChronoUnit.HOURS), now, metric);
        };

    return new AnalyticsResponseDto(metric, range, points, computeStats(points));
  }

  // --- Source methods ---

  private List<AnalyticsResponseDto.DataPoint> fromSnapshots(
      String userId, Instant from, Instant to, String metric) {
    List<HealthSnapshotRecord> records =
        snapshotRepo.findByUserIdAndPeriodStartBetweenOrderByPeriodStartAsc(userId, from, to);
    Function<HealthSnapshotRecord, Double> extractor = snapshotMetricExtractor(metric);
    return records.stream()
        .map(r -> new AnalyticsResponseDto.DataPoint(r.getPeriodStart(), extractor.apply(r)))
        .filter(p -> p.getValue() != null)
        .collect(Collectors.toList());
  }

  private List<AnalyticsResponseDto.DataPoint> fromHourly(
      String userId, Instant from, Instant to, String metric) {
    List<HourlySummary> rows =
        hourlyRepo.findByUserIdAndHourBucketBetweenOrderByHourBucketAsc(userId, from, to);
    Function<HourlySummary, Double> extractor = hourlyMetricExtractor(metric);
    return rows.stream()
        .map(h -> new AnalyticsResponseDto.DataPoint(h.getHourBucket(), extractor.apply(h)))
        .filter(p -> p.getValue() != null)
        .collect(Collectors.toList());
  }

  private List<AnalyticsResponseDto.DataPoint> fromDaily(
      String userId, LocalDate from, LocalDate to, String metric) {
    List<DailySummary> rows =
        summaryRepo.findByUserIdAndDateBetweenOrderByDateAsc(userId, from, to);
    Function<DailySummary, Double> extractor = dailyMetricExtractor(metric);
    return rows.stream()
        .map(
            d ->
                new AnalyticsResponseDto.DataPoint(
                    d.getDate().atStartOfDay(ZoneOffset.UTC).toInstant(),
                    extractor.apply(d)))
        .filter(p -> p.getValue() != null)
        .collect(Collectors.toList());
  }

  // --- Metric extractors ---

  private Function<HealthSnapshotRecord, Double> snapshotMetricExtractor(String metric) {
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

  private Function<HourlySummary, Double> hourlyMetricExtractor(String metric) {
    return switch (metric.toLowerCase()) {
      case "steps" -> h -> h.getSteps() != null ? h.getSteps().doubleValue() : null;
      case "distance" -> HourlySummary::getDistanceMeters;
      case "calories" -> HourlySummary::getActiveCaloriesKcal;
      case "avghr", "heartrate" -> h -> h.getHeartRateCount() != null && h.getHeartRateCount() > 0 ? h.getAvgHeartRateBpm() : null;
      case "restinghr" -> HourlySummary::getRestingHeartRateBpm;
      case "spo2" -> h -> h.getBloodOxygenCount() != null && h.getBloodOxygenCount() > 0 ? h.getBloodOxygenPct() : null;
      case "sleep" -> h -> h.getSleepDurationMinutes() != null ? h.getSleepDurationMinutes().doubleValue() : null;
      case "hrzone" -> h -> h.getHeartRateZoneMinutes() != null ? h.getHeartRateZoneMinutes().doubleValue() : null;
      default -> h -> null;
    };
  }

  private Function<DailySummary, Double> dailyMetricExtractor(String metric) {
    return switch (metric.toLowerCase()) {
      case "steps" -> d -> d.getSteps() != null ? d.getSteps().doubleValue() : null;
      case "distance" -> DailySummary::getDistanceMeters;
      case "calories" -> DailySummary::getActiveCaloriesKcal;
      case "avghr", "heartrate" -> d -> d.getHeartRateCount() != null && d.getHeartRateCount() > 0 ? d.getAvgHeartRateBpm() : null;
      case "restinghr" -> DailySummary::getRestingHeartRateBpm;
      case "spo2" -> d -> d.getBloodOxygenCount() != null && d.getBloodOxygenCount() > 0 ? d.getBloodOxygenPct() : null;
      case "sleep" -> d -> d.getSleepDurationMinutes() != null ? d.getSleepDurationMinutes().doubleValue() : null;
      case "hrzone" -> d -> d.getHeartRateZoneMinutes() != null ? d.getHeartRateZoneMinutes().doubleValue() : null;
      default -> d -> null;
    };
  }

  // --- Stats ---

  private AnalyticsResponseDto.StatsSummary computeStats(List<AnalyticsResponseDto.DataPoint> points) {
    if (points.isEmpty()) return new AnalyticsResponseDto.StatsSummary(0.0, 0.0, 0.0, 0.0);
    DoubleSummaryStatistics stats =
        points.stream().mapToDouble(AnalyticsResponseDto.DataPoint::getValue).summaryStatistics();
    double latest = points.get(points.size() - 1).getValue();
    return new AnalyticsResponseDto.StatsSummary(stats.getAverage(), stats.getMin(), stats.getMax(), latest);
  }

  // --- Exercise collection ---

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
