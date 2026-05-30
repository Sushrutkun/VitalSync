package com.vitalsync.service.source;

import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential;
import com.vitalsync.entity.UserSourceCredential.Status;
import com.vitalsync.repository.UserSourceCredentialRepository;
import com.vitalsync.service.HealthSnapshotPublisher;
import java.time.Instant;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Polls cloud sources for connected users. Fitbit & Strava every 15 min; WHOOP daily at 09:00 IST.
 *
 * <p>Each adapter returns a list of {@code HealthSyncRequest}; we publish each to Kafka via the
 * existing pipeline, so dedup/aggregation downstream is unchanged. Per-user failures are isolated.
 */
@Service
@Slf4j
public class SourcePollerScheduler {

  private final UserSourceCredentialRepository credRepo;
  private final HealthSnapshotPublisher publisher;
  private final Map<HealthSource, SourceAdapter> adapters;

  public SourcePollerScheduler(
      UserSourceCredentialRepository credRepo,
      HealthSnapshotPublisher publisher,
      List<SourceAdapter> adapterList) {
    this.credRepo = credRepo;
    this.publisher = publisher;
    Map<HealthSource, SourceAdapter> map = new EnumMap<>(HealthSource.class);
    for (SourceAdapter a : adapterList) map.put(a.source(), a);
    this.adapters = map;
  }

  /** Fitbit + Strava: every 15 minutes (matches the phone-push cadence). */
  @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT1M")
  public void pollFifteenMinuteSources() {
    pollSourcesIn(List.of(HealthSource.FITBIT, HealthSource.STRAVA));
  }

  /** WHOOP: once per day at 09:00 IST (data only updates post-sleep). */
  @Scheduled(cron = "0 0 9 * * ?", zone = "Asia/Kolkata")
  public void pollDailySources() {
    pollSourcesIn(List.of(HealthSource.WHOOP));
  }

  private void pollSourcesIn(List<HealthSource> sources) {
    List<UserSourceCredential> creds =
        credRepo.findAllByStatusAndSourceIn(Status.CONNECTED, sources);
    log.info("SourcePoller: scanning {} connected creds across {}", creds.size(), sources);
    for (UserSourceCredential c : creds) pollOne(c);
  }

  private void pollOne(UserSourceCredential cred) {
    SourceAdapter adapter = adapters.get(cred.getSource());
    if (adapter == null) return;
    try {
      Instant since = cred.getLastPolledAt();
      List<HealthSyncRequest> reqs = adapter.pollLatest(cred.getUserId(), since);
      for (HealthSyncRequest req : reqs) {
        // Namespace the idempotency key (controller does this on the push path).
        req.setIdempotencyKey(cred.getSource().name() + ":" + req.getIdempotencyKey());
        publisher.publish(req);
      }
      cred.setLastPolledAt(Instant.now());
      cred.setLastError(null);
      credRepo.save(cred);
      if (!reqs.isEmpty())
        log.info("Polled user=[{}] source=[{}] emitted=[{}]",
            cred.getUserId(), cred.getSource(), reqs.size());
    } catch (Exception e) {
      log.warn("Poll failed user=[{}] source=[{}]: {}",
          cred.getUserId(), cred.getSource(), e.getMessage());
      cred.setLastError(e.getMessage());
      credRepo.save(cred);
    }
  }
}
