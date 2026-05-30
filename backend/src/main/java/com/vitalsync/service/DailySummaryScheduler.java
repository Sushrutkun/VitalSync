package com.vitalsync.service;

import com.vitalsync.entity.DailySummary;
import com.vitalsync.entity.HealthSnapshotRecord;
import com.vitalsync.repository.DailySummaryRepository;
import com.vitalsync.repository.HealthSnapshotRecordRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DailySummaryScheduler {

  private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

  private final HealthSnapshotRecordRepository snapshotRepo;
  private final DailySummaryRepository summaryRepo;

  /**
   * Runs at 00:00 IST every day. Recomputes yesterday's daily_summary from raw snapshots for all
   * users, overwriting any streaming values written during the day by the Kafka consumer.
   */
  @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
  @Transactional
  public void finalizePreviousDay() {
    LocalDate yesterday = LocalDate.now(IST).minusDays(1);
    log.info("DailySummaryScheduler: finalizing date={}", yesterday);

    Instant dayStart = yesterday.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant dayEnd = yesterday.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    List<HealthSnapshotRecord> records =
        snapshotRepo.findByPeriodStartBetweenOrderByPeriodStartAsc(dayStart, dayEnd);

    if (records.isEmpty()) {
      log.info("DailySummaryScheduler: no snapshots for date={}, skipping", yesterday);
      return;
    }

    Map<String, List<HealthSnapshotRecord>> byUser =
        records.stream().collect(Collectors.groupingBy(HealthSnapshotRecord::getUserId));

    for (Map.Entry<String, List<HealthSnapshotRecord>> entry : byUser.entrySet()) {
      String userId = entry.getKey();
      List<HealthSnapshotRecord> userRecords = entry.getValue();

      DailySummary summary =
          summaryRepo
              .findByUserIdAndDate(userId, yesterday)
              .orElseGet(
                  () ->
                      DailySummary.builder()
                          .userId(userId)
                          .date(yesterday)
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
                          .build());

      // Full recompute — not streaming max, clean slate from all snapshots for the day.
      long steps = 0L;
      double distanceMeters = 0.0;
      double activeCaloriesKcal = 0.0;
      long heartRateZoneMinutes = 0L;
      double heartRateBpmSum = 0.0;
      int heartRateCount = 0;
      double restingHeartRateBpm = Double.MAX_VALUE;
      double bloodOxygenSum = 0.0;
      int bloodOxygenCount = 0;
      long sleepDurationMinutes = 0L;

      for (HealthSnapshotRecord r : userRecords) {
        if (r.getStepsTotal() != null && r.getStepsTotal() > steps)
          steps = r.getStepsTotal();
        if (r.getDistanceMeters() != null && r.getDistanceMeters() > distanceMeters)
          distanceMeters = r.getDistanceMeters();
        if (r.getActiveCaloriesKcal() != null && r.getActiveCaloriesKcal() > activeCaloriesKcal)
          activeCaloriesKcal = r.getActiveCaloriesKcal();
        if (r.getHeartRateZoneMinutes() != null && r.getHeartRateZoneMinutes() > heartRateZoneMinutes)
          heartRateZoneMinutes = r.getHeartRateZoneMinutes();
        if (r.getSleepDurationMinutes() != null && r.getSleepDurationMinutes() > sleepDurationMinutes)
          sleepDurationMinutes = r.getSleepDurationMinutes();
        if (r.getHeartRateBpm() != null) {
          heartRateBpmSum += r.getHeartRateBpm();
          heartRateCount++;
          if (r.getHeartRateBpm() < restingHeartRateBpm) restingHeartRateBpm = r.getHeartRateBpm();
        }
        if (r.getBloodOxygenPct() != null) {
          bloodOxygenSum += r.getBloodOxygenPct();
          bloodOxygenCount++;
        }
      }

      summary.setSteps(steps);
      summary.setDistanceMeters(distanceMeters);
      summary.setActiveCaloriesKcal(activeCaloriesKcal);
      summary.setHeartRateZoneMinutes(heartRateZoneMinutes);
      summary.setSleepDurationMinutes(sleepDurationMinutes);
      summary.setHeartRateBpmSum(heartRateBpmSum);
      summary.setHeartRateCount(heartRateCount);
      summary.setRestingHeartRateBpm(heartRateCount > 0 ? restingHeartRateBpm : null);
      summary.setBloodOxygenSum(bloodOxygenSum);
      summary.setBloodOxygenCount(bloodOxygenCount);
      summary.setUpdatedAt(Instant.now());

      summaryRepo.save(summary);
      log.info(
          "DailySummaryScheduler: finalized user=[{}] date=[{}] steps=[{}] records=[{}]",
          userId, yesterday, steps, userRecords.size());
    }
  }
}
