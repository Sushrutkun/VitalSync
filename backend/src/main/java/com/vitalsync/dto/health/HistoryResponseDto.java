package com.vitalsync.dto.health;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Cursor-paginated response returned by {@code GET /api/v1/health/history}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoryResponseDto {
    List<HealthSnapshot> snapshots;
    String nextCursor;
    long total;
}
