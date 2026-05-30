package com.vitalsync.service.source;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.dto.health.HealthSnapshot;
import com.vitalsync.dto.health.HealthSyncRequest;
import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential;
import com.vitalsync.entity.UserSourceCredential.Status;
import com.vitalsync.repository.UserSourceCredentialRepository;
import com.vitalsync.service.CredentialVault;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Fitbit OAuth2 + REST adapter.
 *
 * <p>OAuth2 authorization code flow:
 * <ol>
 *   <li>{@link #beginConnect} → returns authorize URL with signed state JWT
 *   <li>User authenticates in browser → Fitbit redirects to {@code /sources/FITBIT/callback}
 *   <li>{@link #completeOAuth} exchanges code for tokens → stores encrypted
 * </ol>
 *
 * <p>Polling fetches today's step+heart-rate intraday data each tick.
 */
@Service
@Slf4j
public class FitbitAdapter implements SourceAdapter {

  private static final String AUTHORIZE_BASE = "https://www.fitbit.com/oauth2/authorize";
  private static final String TOKEN_URL = "https://api.fitbit.com/oauth2/token";
  private static final String API_BASE = "https://api.fitbit.com";

  private final UserSourceCredentialRepository credRepo;
  private final CredentialVault vault;
  private final OAuthStateService stateService;
  private final ObjectMapper objectMapper;
  private final RestTemplate http = new RestTemplate();

  private final String clientId;
  private final String clientSecret;
  private final String redirectUri;
  private final String scopes;

  public FitbitAdapter(
      UserSourceCredentialRepository credRepo,
      CredentialVault vault,
      OAuthStateService stateService,
      ObjectMapper objectMapper,
      @Value("${vitalsync.sources.fitbit.client-id}") String clientId,
      @Value("${vitalsync.sources.fitbit.client-secret}") String clientSecret,
      @Value("${vitalsync.sources.fitbit.redirect-uri}") String redirectUri,
      @Value("${vitalsync.sources.fitbit.scopes}") String scopes) {
    this.credRepo = credRepo;
    this.vault = vault;
    this.stateService = stateService;
    this.objectMapper = objectMapper;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
  }

  @Override
  public HealthSource source() {
    return HealthSource.FITBIT;
  }

  @Override
  public ConnectResponse beginConnect(String userId) {
    if (clientId == null || clientId.isBlank()) {
      throw new IllegalStateException("Fitbit client ID not configured (FITBIT_CLIENT_ID)");
    }
    String state = stateService.sign(userId, HealthSource.FITBIT);
    String url =
        AUTHORIZE_BASE
            + "?response_type=code"
            + "&client_id=" + enc(clientId)
            + "&redirect_uri=" + enc(redirectUri)
            + "&scope=" + enc(scopes)
            + "&state=" + enc(state);
    return ConnectResponse.builder()
        .flow(ConnectResponse.Flow.OAUTH)
        .authorizeUrl(url)
        .state(state)
        .build();
  }

  @Override
  public void completeOAuth(String userId, String code) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    headers.setBasicAuth(clientId, clientSecret);

    MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
    body.add("grant_type", "authorization_code");
    body.add("code", code);
    body.add("redirect_uri", redirectUri);
    body.add("client_id", clientId);

    try {
      ResponseEntity<JsonNode> resp =
          http.exchange(URI.create(TOKEN_URL), HttpMethod.POST,
              new HttpEntity<>(body, headers), JsonNode.class);
      JsonNode json = Objects.requireNonNull(resp.getBody(), "empty token response");

      String accessToken = json.path("access_token").asText(null);
      String refreshToken = json.path("refresh_token").asText(null);
      long expiresIn = json.path("expires_in").asLong(28800);
      if (accessToken == null) throw new IllegalStateException("no access_token in response");

      UserSourceCredential cred =
          credRepo
              .findByUserIdAndSource(userId, HealthSource.FITBIT)
              .orElseGet(() ->
                  UserSourceCredential.builder()
                      .userId(userId)
                      .source(HealthSource.FITBIT)
                      .build());
      cred.setStatus(Status.CONNECTED);
      cred.setAccessTokenEnc(vault.encrypt(accessToken));
      cred.setRefreshTokenEnc(refreshToken != null ? vault.encrypt(refreshToken) : null);
      cred.setScopes(json.path("scope").asText(scopes));
      cred.setExpiresAt(Instant.now().plusSeconds(expiresIn));
      cred.setConnectedAt(cred.getConnectedAt() != null ? cred.getConnectedAt() : Instant.now());
      cred.setLastError(null);
      credRepo.save(cred);
      log.info("Fitbit OAuth complete user=[{}]", userId);
    } catch (HttpClientErrorException e) {
      log.error("Fitbit token exchange failed: {}", e.getResponseBodyAsString());
      throw new IllegalStateException("Fitbit token exchange failed: " + e.getStatusCode(), e);
    } catch (RestClientException e) {
      throw new IllegalStateException("Fitbit token exchange transport error", e);
    }
  }

  @Override
  public List<HealthSyncRequest> pollLatest(String userId, Instant since) {
    UserSourceCredential cred =
        credRepo.findByUserIdAndSource(userId, HealthSource.FITBIT).orElse(null);
    if (cred == null || cred.getStatus() != Status.CONNECTED) return List.of();

    String accessToken = vault.decrypt(cred.getAccessTokenEnc());
    LocalDate today = LocalDate.now();
    HealthSnapshot snap = fetchTodaySnapshot(accessToken, today);
    if (snap == null) return List.of();

    HealthSyncRequest req = new HealthSyncRequest();
    req.setUserId(userId);
    req.setSource(HealthSource.FITBIT);
    req.setIdempotencyKey(UUID.randomUUID().toString());
    req.setPeriodStart(today.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
    req.setPeriodEnd(Instant.now());
    req.setSnapshot(snap);
    return List.of(req);
  }

  @Override
  public List<HealthSyncRequest> fetchBackfillChunk(
      String userId, LocalDate from, LocalDate to) {
    UserSourceCredential cred =
        credRepo.findByUserIdAndSource(userId, HealthSource.FITBIT).orElse(null);
    if (cred == null || cred.getStatus() != Status.CONNECTED) return List.of();
    String accessToken = vault.decrypt(cred.getAccessTokenEnc());

    List<HealthSyncRequest> out = new ArrayList<>();
    for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
      HealthSnapshot snap = fetchTodaySnapshot(accessToken, d);
      if (snap == null) continue;
      HealthSyncRequest req = new HealthSyncRequest();
      req.setUserId(userId);
      req.setSource(HealthSource.FITBIT);
      // Stable per-day key so re-runs of the same date dedupe at the DB layer
      req.setIdempotencyKey("day-" + d);
      req.setPeriodStart(d.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
      req.setPeriodEnd(d.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
      req.setSnapshot(snap);
      out.add(req);
    }
    return out;
  }

  /** Fetches today's daily aggregate. Intraday is a Phase-2.1 enhancement. */
  private HealthSnapshot fetchTodaySnapshot(String accessToken, LocalDate date) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    HttpEntity<Void> req = new HttpEntity<>(headers);

    String dateStr = date.toString();
    try {
      JsonNode steps = http.exchange(
          API_BASE + "/1/user/-/activities/steps/date/" + dateStr + "/1d.json",
          HttpMethod.GET, req, JsonNode.class).getBody();
      JsonNode heart = http.exchange(
          API_BASE + "/1/user/-/activities/heart/date/" + dateStr + "/1d.json",
          HttpMethod.GET, req, JsonNode.class).getBody();

      Long stepCount = extractLong(steps, "activities-steps", "value");
      Double restingHr = extractDouble(heart, "activities-heart", "restingHeartRate");

      HealthSnapshot snap = new HealthSnapshot();
      snap.setTimestamp(Instant.now());
      snap.setPeriodStart(date.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
      snap.setPeriodEnd(Instant.now());
      snap.setStepsTotal(stepCount);
      snap.setHeartRateBpm(restingHr);
      snap.setExerciseSessions(List.of());
      return snap;
    } catch (Exception e) {
      log.warn("Fitbit fetch failed for date={}: {}", dateStr, e.getMessage());
      return null;
    }
  }

  private static Long extractLong(JsonNode root, String arrField, String valField) {
    if (root == null) return null;
    JsonNode arr = root.path(arrField);
    if (!arr.isArray() || arr.isEmpty()) return null;
    String v = arr.get(0).path(valField).asText(null);
    try { return v != null ? Long.parseLong(v) : null; } catch (NumberFormatException e) { return null; }
  }

  private static Double extractDouble(JsonNode root, String arrField, String valField) {
    if (root == null) return null;
    JsonNode arr = root.path(arrField);
    if (!arr.isArray() || arr.isEmpty()) return null;
    JsonNode summary = arr.get(0).path("value").path(valField);
    return summary.isNumber() ? summary.asDouble() : null;
  }

  private static String enc(String s) {
    return URLEncoder.encode(s, StandardCharsets.UTF_8);
  }
}
