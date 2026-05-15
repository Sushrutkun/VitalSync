package com.vitalsync.dev;

import com.vitalsync.dto.health.ExerciseSession;
import com.vitalsync.dto.health.HealthSnapshot;
import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.service.HealthSnapshotPublisher;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Bulk-seeds dummy HealthSyncRequest messages for analytics workloads.
 *
 * <p>Activate: --spring.profiles.active=seed-kafka
 *
 * <p>Tunables in application.yml under {@code vitalsync.seed.*} (count, users, days-back,
 * log-every). Override via env vars SEED_COUNT, SEED_USERS, SEED_DAYS_BACK, SEED_LOG_EVERY.
 */
@Component
@Profile("seed-kafka")
@RequiredArgsConstructor
@Slf4j
public class KafkaDummyDataSeeder implements CommandLineRunner {

  private static final String[] EXERCISE_TYPES = {
    "RUNNING", "WALKING", "CYCLING", "YOGA", "HIIT", "SWIMMING", "STRENGTH", "ROWING"
  };

  private final HealthSnapshotPublisher publisher;
  private final SeedProperties props;

  @Override
  public void run(String... args) {
    int count = props.getCount();
    int users = props.getUsers();
    int daysBack = props.getDaysBack();
    int logEvery = props.getLogEvery();

    log.info("Seeding count={} users={} daysBack={} logEvery={}", count, users, daysBack, logEvery);

    long startNs = System.nanoTime();
    long failures = 0;

    for (int i = 0; i < count; i++) {
      String userId = "user-" + (ThreadLocalRandom.current().nextInt(users) + 1);
      try {
        publisher.publish(buildRandomRequest(userId, daysBack));
      } catch (RuntimeException e) {
        failures++;
        if (failures <= 5) {
          log.warn("Publish failed (#{}): {}", failures, e.getMessage());
        }
      }

      if ((i + 1) % logEvery == 0) {
        double elapsedSec = (System.nanoTime() - startNs) / 1_000_000_000.0;
        double rate = (i + 1) / elapsedSec;
        log.info(
            "Progress {}/{} ({}%), {} msg/s, failures={}",
            i + 1, count, (i + 1) * 100 / count, String.format("%.1f", rate), failures);
      }
    }

    double totalSec = (System.nanoTime() - startNs) / 1_000_000_000.0;
    log.info(
        "Seeding done: {} msgs in {}s ({} msg/s), failures={}",
        count,
        String.format("%.1f", totalSec),
        String.format("%.1f", count / totalSec),
        failures);
  }

  private HealthSyncRequest buildRandomRequest(String userId, int daysBack) {
    ThreadLocalRandom rng = ThreadLocalRandom.current();

    long maxBackSec = (long) daysBack * 24 * 3600;
    Instant end = Instant.now().minusSeconds(rng.nextLong(0, maxBackSec));
    int windowMin = rng.nextInt(5, 121);
    Instant start = end.minus(Duration.ofMinutes(windowMin));

    int sessionCount = rng.nextInt(0, 4);
    List<ExerciseSession> sessions =
        sessionCount == 0
            ? List.of()
            : java.util.stream.IntStream.range(0, sessionCount)
                .mapToObj(k -> randomSession(start, end, rng))
                .toList();

    HealthSnapshot snapshot =
        new HealthSnapshot(
            end,
            start,
            end,
            rng.nextDouble(50, 180),
            rng.nextLong(0, 25_000),
            rng.nextLong(0, 3_000),
            rng.nextDouble(90, 100),
            rng.nextDouble(0, 800),
            rng.nextDouble(0, 8_000),
            rng.nextLong(0, 60),
            sessions);

    return new HealthSyncRequest(userId, UUID.randomUUID().toString(), start, end, snapshot);
  }

  private ExerciseSession randomSession(Instant start, Instant end, ThreadLocalRandom rng) {
    int durMin = (int) Math.max(1, Duration.between(start, end).toMinutes());
    return new ExerciseSession(
        EXERCISE_TYPES[rng.nextInt(EXERCISE_TYPES.length)],
        start,
        end,
        durMin,
        rng.nextDouble(20, 800),
        rng.nextDouble(0, 10_000),
        rng.nextDouble(70, 180));
  }
}
