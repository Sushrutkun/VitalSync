package com.vitalsync.dto.health;

import java.util.List;

/** Cursor-paginated response returned by {@code GET /api/v1/health/history}. */
public record HistoryResponseDto(List<HealthSnapshot> snapshots, String nextCursor, long total) {}
