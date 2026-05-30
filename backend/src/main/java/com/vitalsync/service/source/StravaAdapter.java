package com.vitalsync.service.source;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Strava OAuth2 + REST adapter.
 *
 * <p>Polls recent activities since {@code last_polled_at}. Each activity becomes one
 * HealthSyncRequest with its time window + aggregate metrics (distance, calories, avg HR).
 */
@Service
@Slf4j
public class StravaAdapter implements SourceAdapter {

  private static final String AUTHORIZE_BASE = "https://www.strava.com/oauth/authorize";
  private static final String TOKEN_URL = "https://www.strava.com/oauth/token";
  private static final String API_BASE = "https://www.strava.com/api/v3";

  private final UserSourceCredentialRepository credRepo;
  private final CredentialVault vault;
  private final OAuthStateService stateService;
  private final RestTemplate http = new RestTemplate();

  private final String clientId;
  private final String clientSecret;
  private final String redirectUri;
  private final String scopes;

  public StravaAdapter(
      UserSourceCredentialRepository credRepo,
      CredentialVault vault,
      OAuthStateService stateService,
      @Value("${vitalsync.sources.strava.client-id}") String clientId,
      @Value("${vitalsync.sources.strava.client-secret}") String clientSecret,
      @Value("${vitalsync.sources.strava.redirect-uri}") String redirectUri,
      @Value("${vitalsync.sources.strava.scopes}") String scopes) {
    this.credRepo = credRepo;
    this.vault = vault;
    this.stateService = stateService;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
  }

  @Override
  public HealthSource source() {
    return HealthSource.STRAVA;
  }

  @Override
  public ConnectResponse beginConnect(String userId) {
    if (clientId == null || clientId.isBlank()) {
      throw new IllegalStateException("Strava client ID not configured (STRAVA_CLIENT_ID)");
    }
    String state = stateService.sign(userId, HealthSource.STRAVA);
    String url =
        AUTHORIZE_BASE
            + "?response_type=code"
            + "&client_id=" + enc(clientId)
            + "&redirect_uri=" + enc(redirectUri)
            + "&scope=" + enc(scopes)
            + "&approval_prompt=auto"
            + "&state=" + enc(state);
    return ConnectResponse.builder()
        .flow(ConnectResponse.Flow.OAUTH)
        .authorizeUrl(url)
        .state(state)
        .build();
  }

  @Override
  public void completeOAuth(String userId, String code) {
    MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
    body.add("client_id", clientId);
    body.add("client_secret", clientSecret);
    body.add("code", code);
    body.add("grant_type", "authorization_code");

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    try {
      JsonNode json =
          http.exchange(URI.create(TOKEN_URL), HttpMethod.POST,
              new HttpEntity<>(body, headers), JsonNode.class).getBody();
      Objects.requireNonNull(json, "empty token response");

      String accessToken = json.path("access_token").asText(null);
      String refreshToken = json.path("refresh_token").asText(null);
      long expiresAt = json.path("expires_at").asLong(0);
      if (accessToken == null) throw new IllegalStateException("no access_token");

      UserSourceCredential cred =
          credRepo
              .findByUserIdAndSource(userId, HealthSource.STRAVA)
              .orElseGet(() ->
                  UserSourceCredential.builder()
                      .userId(userId)
                      .source(HealthSource.STRAVA)
                      .build());
      cred.setStatus(Status.CONNECTED);
      cred.setAccessTokenEnc(vault.encrypt(accessToken));
      cred.setRefreshTokenEnc(refreshToken != null ? vault.encrypt(refreshToken) : null);
      cred.setScopes(scopes);
      cred.setExpiresAt(expiresAt > 0 ? Instant.ofEpochSecond(expiresAt) : null);
      cred.setConnectedAt(cred.getConnectedAt() != null ? cred.getConnectedAt() : Instant.now());
      cred.setLastError(null);
      credRepo.save(cred);
      log.info("Strava OAuth complete user=[{}]", userId);
    } catch (HttpClientErrorException e) {
      log.error("Strava token exchange failed: {}", e.getResponseBodyAsString());
      throw new IllegalStateException("Strava token exchange failed: " + e.getStatusCode(), e);
    }
  }

  @Override
  public List<HealthSyncRequest> pollLatest(String userId, Instant since) {
    UserSourceCredential cred =
        credRepo.findByUserIdAndSource(userId, HealthSource.STRAVA).orElse(null);
    if (cred == null || cred.getStatus() != Status.CONNECTED) return List.of();

    String accessToken = vault.decrypt(cred.getAccessTokenEnc());
    long afterEpoch = since != null ? since.getEpochSecond() : Instant.now().minus(Duration.ofDays(1)).getEpochSecond();

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    HttpEntity<Void> req = new HttpEntity<>(headers);

    try {
      JsonNode activities =
          http.exchange(
                  API_BASE + "/athlete/activities?after=" + afterEpoch + "&per_page=50",
                  HttpMethod.GET, req, JsonNode.class)
              .getBody();
      if (activities == null || !activities.isArray()) return List.of();

      List<HealthSyncRequest> out = new ArrayList<>();
      for (JsonNode act : activities) {
        HealthSyncRequest hr = activityToRequest(userId, act);
        if (hr != null) out.add(hr);
      }
      return out;
    } catch (Exception e) {
      log.warn("Strava poll failed user=[{}]: {}", userId, e.getMessage());
      return List.of();
    }
  }

  @Override
  public List<HealthSyncRequest> fetchBackfillChunk(
      String userId, java.time.LocalDate from, java.time.LocalDate to) {
    UserSourceCredential cred =
        credRepo.findByUserIdAndSource(userId, HealthSource.STRAVA).orElse(null);
    if (cred == null || cred.getStatus() != Status.CONNECTED) return List.of();
    String accessToken = vault.decrypt(cred.getAccessTokenEnc());

    long after = from.atStartOfDay(java.time.ZoneOffset.UTC).toEpochSecond();
    long before = to.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toEpochSecond();

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    HttpEntity<Void> req = new HttpEntity<>(headers);

    List<HealthSyncRequest> out = new ArrayList<>();
    int page = 1;
    while (true) {
      try {
        JsonNode activities =
            http.exchange(
                    API_BASE + "/athlete/activities?after=" + after + "&before=" + before
                        + "&per_page=200&page=" + page,
                    HttpMethod.GET, req, JsonNode.class)
                .getBody();
        if (activities == null || !activities.isArray() || activities.isEmpty()) break;
        for (JsonNode act : activities) {
          HealthSyncRequest hr = activityToRequest(userId, act);
          if (hr != null) out.add(hr);
        }
        if (activities.size() < 200) break;
        page++;
      } catch (Exception e) {
        log.warn("Strava backfill page {} failed user=[{}]: {}", page, userId, e.getMessage());
        break;
      }
    }
    return out;
  }

  private HealthSyncRequest activityToRequest(String userId, JsonNode act) {
    String startStr = act.path("start_date").asText(null);
    if (startStr == null) return null;
    Instant start = Instant.parse(startStr);
    long elapsed = act.path("elapsed_time").asLong(0);
    Instant end = start.plusSeconds(elapsed);

    HealthSnapshot snap = new HealthSnapshot();
    snap.setTimestamp(Instant.now());
    snap.setPeriodStart(start);
    snap.setPeriodEnd(end);
    snap.setDistanceMeters(act.has("distance") ? act.get("distance").asDouble() : null);
    snap.setActiveCaloriesKcal(act.has("calories") ? act.get("calories").asDouble() : null);
    snap.setHeartRateBpm(act.has("average_heartrate") ? act.get("average_heartrate").asDouble() : null);
    snap.setExerciseSessions(List.of());

    HealthSyncRequest req = new HealthSyncRequest();
    req.setUserId(userId);
    req.setSource(HealthSource.STRAVA);
    // Strava activity id is stable → use it for idempotency so retries dedupe cleanly
    req.setIdempotencyKey("activity-" + act.path("id").asLong());
    req.setPeriodStart(start);
    req.setPeriodEnd(end);
    req.setSnapshot(snap);
    return req;
  }

  private static String enc(String s) {
    return URLEncoder.encode(s, StandardCharsets.UTF_8);
  }
}
