package com.vitalsync.entity;

/**
 * Identifies which external system produced a health snapshot.
 *
 * <p>Cloud sources (FITBIT, STRAVA, WHOOP) are polled by the backend's SourcePollerScheduler.
 * Device-local sources (HEALTH_CONNECT, HEALTHKIT, GADGETBRIDGE) are pushed by the phone via
 * {@code POST /api/v1/health/sync}.
 */
public enum HealthSource {
  HEALTH_CONNECT,
  HEALTHKIT,
  GADGETBRIDGE,
  FITBIT,
  STRAVA,
  WHOOP
}
