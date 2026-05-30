package com.vitalsync.service.source;

import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.entity.HealthSource;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Abstracts a third-party data source.
 *
 * <p>Cloud sources (Fitbit, Strava, WHOOP) implement OAuth/credential flows + cloud polling.
 * Device-local sources (HealthConnect, HealthKit, Gadgetbridge) only need {@link #beginConnect}
 * to return DEVICE_LOCAL instructions; polling is degenerate (phone pushes data).
 */
public interface SourceAdapter {

  HealthSource source();

  /** Returns the connect-flow descriptor for the frontend. */
  ConnectResponse beginConnect(String userId);

  /**
   * Completes OAuth (code → tokens). Stores encrypted credentials. Throws on failure.
   * Only meaningful for OAUTH-flow sources.
   */
  default void completeOAuth(String userId, String code) {
    throw new UnsupportedOperationException(source() + " is not an OAuth source");
  }

  /** Submit raw credentials (WHOOP email+password). Only meaningful for CREDENTIALS-flow sources. */
  default void submitCredentials(String userId, String credentialsJson) {
    throw new UnsupportedOperationException(source() + " does not accept credentials");
  }

  /** Polls latest deltas since {@code since}. Returns one HealthSyncRequest per emit window. */
  default List<HealthSyncRequest> pollLatest(String userId, Instant since) {
    return List.of();
  }

  /** Fetches a single chunk during historical backfill. */
  default List<HealthSyncRequest> fetchBackfillChunk(
      String userId, LocalDate from, LocalDate to) {
    return List.of();
  }
}
