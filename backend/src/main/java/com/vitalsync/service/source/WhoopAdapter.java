package com.vitalsync.service.source;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.dto.health.HealthSnapshot;
import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential;
import com.vitalsync.entity.UserSourceCredential.Status;
import com.vitalsync.repository.UserSourceCredentialRepository;
import com.vitalsync.service.CredentialVault;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * WHOOP unofficial-API adapter.
 *
 * <p>WHOOP has no public OAuth flow. We accept the user's email + password, store them encrypted
 * in {@code credentials_json_enc}, and on each (daily) poll spin up a fresh login session via
 * the unofficial API.
 *
 * <p>Phase 3 ships the connect/store/list flow. Real cycle+sleep ingestion is stubbed —
 * a Python sidecar (or Java port of {@code whoop-python}) would handle the actual HTTPS calls
 * in production. For now {@link #pollLatest} returns empty so the poller doesn't break.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class WhoopAdapter implements SourceAdapter {

  private final UserSourceCredentialRepository credRepo;
  private final CredentialVault vault;
  private final ObjectMapper objectMapper;

  @Override
  public HealthSource source() {
    return HealthSource.WHOOP;
  }

  @Override
  public ConnectResponse beginConnect(String userId) {
    return ConnectResponse.builder()
        .flow(ConnectResponse.Flow.CREDENTIALS)
        .fields(List.of("email", "password"))
        .instructions("Enter your WHOOP login. Stored encrypted at rest.")
        .build();
  }

  @Override
  public void submitCredentials(String userId, String credentialsJson) {
    // Parse & validate shape — must have email + password
    Map<String, String> creds;
    try {
      creds = objectMapper.readValue(credentialsJson, new TypeReference<>() {});
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid credentials JSON", e);
    }
    String email = creds.get("email");
    String password = creds.get("password");
    if (email == null || email.isBlank() || password == null || password.isBlank()) {
      throw new IllegalArgumentException("Both email and password are required");
    }

    UserSourceCredential cred =
        credRepo
            .findByUserIdAndSource(userId, HealthSource.WHOOP)
            .orElseGet(() ->
                UserSourceCredential.builder()
                    .userId(userId)
                    .source(HealthSource.WHOOP)
                    .build());
    cred.setStatus(Status.CONNECTED);
    cred.setCredentialsJsonEnc(vault.encrypt(credentialsJson));
    cred.setConnectedAt(cred.getConnectedAt() != null ? cred.getConnectedAt() : Instant.now());
    cred.setLastError(null);
    credRepo.save(cred);
    log.info("WHOOP credentials stored user=[{}]", userId);
  }

  @Override
  public List<HealthSyncRequest> pollLatest(String userId, Instant since) {
    UserSourceCredential cred =
        credRepo.findByUserIdAndSource(userId, HealthSource.WHOOP).orElse(null);
    if (cred == null || cred.getStatus() != Status.CONNECTED) return List.of();
    if (cred.getCredentialsJsonEnc() == null) {
      log.warn("WHOOP credentials missing for user=[{}]", userId);
      return List.of();
    }

    // STUB: real impl logs in via unofficial API, fetches cycles + sleep for the day,
    // maps WHOOP fields (recovery, HRV, strain, sleep stages) → HealthSnapshot.
    // This requires a Python sidecar or a Java port of whoop-python. Tracked separately.
    log.debug("WHOOP poll user=[{}] — real ingestion is a future task", userId);

    HealthSnapshot snap = new HealthSnapshot();
    snap.setTimestamp(Instant.now());
    snap.setPeriodStart(Instant.now().minusSeconds(86400));
    snap.setPeriodEnd(Instant.now());
    snap.setExerciseSessions(List.of());

    HealthSyncRequest req = new HealthSyncRequest();
    req.setUserId(userId);
    req.setSource(HealthSource.WHOOP);
    req.setIdempotencyKey("stub-" + UUID.randomUUID());
    req.setPeriodStart(snap.getPeriodStart());
    req.setPeriodEnd(snap.getPeriodEnd());
    req.setSnapshot(snap);
    // Return empty for now — don't pollute the snapshot table with stub rows.
    return List.of();
  }
}
