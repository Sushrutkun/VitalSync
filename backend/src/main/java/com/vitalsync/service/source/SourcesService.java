package com.vitalsync.service.source;

import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.dto.sources.SourceStatusDto;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential;
import com.vitalsync.entity.UserSourceCredential.Status;
import com.vitalsync.repository.UserSourceCredentialRepository;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Manages user → source connections (read/disconnect/connect-skeleton).
 *
 * <p>Phase 1: connect() returns a stub response per source flow so the frontend can be built
 * before real OAuth adapters land. Phase 2 introduces FitbitAdapter, etc.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SourcesService {

  /** Sources that the backend polls via cloud API. The rest are pushed by the phone. */
  public static final Set<HealthSource> CLOUD_POLLED =
      EnumSet.of(HealthSource.FITBIT, HealthSource.STRAVA, HealthSource.WHOOP);

  /** Sources that support phased historical backfill. */
  public static final Set<HealthSource> BACKFILL_CAPABLE =
      EnumSet.of(HealthSource.FITBIT, HealthSource.STRAVA, HealthSource.WHOOP);

  private final UserSourceCredentialRepository credRepo;

  public List<SourceStatusDto> listSources(String userId) {
    Map<HealthSource, UserSourceCredential> existing = new EnumMap<>(HealthSource.class);
    for (UserSourceCredential c : credRepo.findAllByUserId(userId)) existing.put(c.getSource(), c);

    List<SourceStatusDto> out = new ArrayList<>();
    for (HealthSource source : HealthSource.values()) {
      UserSourceCredential c = existing.get(source);
      out.add(
          SourceStatusDto.builder()
              .source(source)
              .status(c != null ? c.getStatus() : Status.NOT_CONNECTED)
              .connectedAt(c != null ? c.getConnectedAt() : null)
              .lastPolledAt(c != null ? c.getLastPolledAt() : null)
              .lastError(c != null ? c.getLastError() : null)
              .supportsBackfill(BACKFILL_CAPABLE.contains(source))
              .cloudPolled(CLOUD_POLLED.contains(source))
              .build());
    }
    return out;
  }

  /** Stub — real OAuth URLs land in Phase 2/3 when adapters are added. */
  public ConnectResponse beginConnect(String userId, HealthSource source) {
    return switch (source) {
      case FITBIT, STRAVA ->
          ConnectResponse.builder()
              .flow(ConnectResponse.Flow.OAUTH)
              .authorizeUrl("https://stub.local/authorize?source=" + source.name())
              .state("stub-state-token")
              .build();
      case WHOOP ->
          ConnectResponse.builder()
              .flow(ConnectResponse.Flow.CREDENTIALS)
              .fields(List.of("email", "password"))
              .build();
      case HEALTH_CONNECT, HEALTHKIT, GADGETBRIDGE ->
          ConnectResponse.builder()
              .flow(ConnectResponse.Flow.DEVICE_LOCAL)
              .instructions("Grant permissions on device; phone pushes data to /health/sync.")
              .build();
    };
  }

  public void disconnect(String userId, HealthSource source) {
    credRepo
        .findByUserIdAndSource(userId, source)
        .ifPresentOrElse(
            credRepo::delete,
            () -> {
              throw new ResponseStatusException(
                  HttpStatus.NOT_FOUND, "Not connected: " + source);
            });
    log.info("Disconnected user=[{}] source=[{}]", userId, source);
  }
}
