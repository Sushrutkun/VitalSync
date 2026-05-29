package com.vitalsync.dto.health;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponseDto {
  private String metric;
  private String range;
  private List<DataPoint> points;
  private StatsSummary stats;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DataPoint {
    private Instant timestamp;
    private Double value;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class StatsSummary {
    private Double avg;
    private Double min;
    private Double max;
    private Double latest;
  }
}
