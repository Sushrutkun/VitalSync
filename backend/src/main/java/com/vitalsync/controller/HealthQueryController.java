package com.vitalsync.controller;

import com.vitalsync.dto.health.DailySummaryDto;
import com.vitalsync.dto.health.HistoryResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-side endpoints for health data.
 *
 * <p>STUB: snapshots are published to Kafka by {@link HealthSyncController} but no consumer / read
 * store exists yet, so these endpoints return zeroed metrics and an empty history. Replace with a
 * real implementation once the projection layer lands. Each call logs a warning so it's loud in
 * dev.
 */
@RestController
@RequestMapping("/api/v1/health")
@Tag(
    name = "Health Query (stub)",
    description = "Returns zeroed/empty payloads until read store lands")
@Slf4j
public class HealthQueryController {

  @GetMapping("/summary")
  @Operation(summary = "Get daily summary (stub)")
  public DailySummaryDto summary(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    LocalDate effectiveDate = date != null ? date : LocalDate.now();
    log.warn("STUB /api/v1/health/summary called for date=[{}] — returning zeros", effectiveDate);
    return new DailySummaryDto(effectiveDate, 0L, 0.0, 0.0, 0L, 0.0, 0.0, 0.0, 0L, List.of());
  }

  @GetMapping("/history")
  @Operation(summary = "Get snapshot history (stub)")
  public HistoryResponseDto history(
      @RequestParam String from,
      @RequestParam String to,
      @RequestParam(required = false) String types,
      @RequestParam(required = false) Integer limit,
      @RequestParam(required = false) String cursor) {
    log.warn(
        "STUB /api/v1/health/history called from=[{}] to=[{}] limit=[{}] — returning empty",
        from,
        to,
        limit);
    return new HistoryResponseDto(Collections.emptyList(), null, 0L);
  }
}
