package com.vitalsync.controller;

import com.vitalsync.dto.health.AnalyticsResponseDto;
import com.vitalsync.dto.health.DailySummaryDto;
import com.vitalsync.dto.health.HistoryResponseDto;
import com.vitalsync.service.HealthQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Query", description = "Read-side endpoints for health metrics")
@Slf4j
@RequiredArgsConstructor
public class HealthQueryController {

  private final HealthQueryService healthQueryService;

  @GetMapping("/summary")
  @Operation(summary = "Get daily health summary")
  public DailySummaryDto summary(
      @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date,
      Authentication auth) {
    LocalDate effectiveDate = date != null ? date : LocalDate.now();
    return healthQueryService.getSummary(auth.getName(), effectiveDate);
  }

  @GetMapping("/analytics")
  @Operation(summary = "Get analytics data for a metric over a time range")
  public AnalyticsResponseDto analytics(
      @RequestParam String metric,
      @RequestParam(defaultValue = "DAY") String range,
      Authentication auth) {
    return healthQueryService.getAnalytics(auth.getName(), metric, range);
  }

  @GetMapping("/history")
  @Operation(summary = "Get snapshot history")
  public HistoryResponseDto history(
      @RequestParam String from,
      @RequestParam String to,
      @RequestParam(required = false) String types,
      @RequestParam(required = false) Integer limit,
      @RequestParam(required = false) String cursor) {
    log.warn("STUB /api/v1/health/history — returning empty");
    return new HistoryResponseDto(Collections.emptyList(), null, 0L);
  }
}
