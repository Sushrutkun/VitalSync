package com.vitalsync.service.source;

import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.dto.sources.SourceStatusDto;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential;
import com.vitalsync.entity.UserSourceCredential.Status;
import com.vitalsync.repository.UserSourceCredentialRepository;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class SourcesService {

  public static final Set<HealthSource> CLOUD_POLLED =
      EnumSet.of(HealthSource.FITBIT, HealthSource.STRAVA, HealthSource.WHOOP);

  public static final Set<HealthSource> BACKFILL_CAPABLE =
      EnumSet.of(HealthSource.FITBIT, HealthSource.STRAVA, HealthSource.WHOOP);

  private final UserSourceCredentialRepository credRepo;
  private final Map<HealthSource, SourceAdapter> adapters;

  public SourcesService(
      UserSourceCredentialRepository credRepo, List<SourceAdapter> adapterList) {
    this.credRepo = credRepo;
    Map<HealthSource, SourceAdapter> map = new EnumMap<>(HealthSource.class);
    for (SourceAdapter a : adapterList) map.put(a.source(), a);
    this.adapters = map;
  }

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

  public ConnectResponse beginConnect(String userId, HealthSource source) {
    SourceAdapter adapter = adapters.get(source);
    if (adapter != null) return adapter.beginConnect(userId);
    // Fallback for sources without an adapter yet
    return ConnectResponse.builder()
        .flow(ConnectResponse.Flow.DEVICE_LOCAL)
        .instructions("Source not yet implemented")
        .build();
  }

  public void completeOAuth(String userId, HealthSource source, String code) {
    SourceAdapter adapter = adapters.get(source);
    if (adapter == null) {
      throw new ResponseStatusException(
          HttpStatus.NOT_IMPLEMENTED, "No adapter for source " + source);
    }
    adapter.completeOAuth(userId, code);
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
