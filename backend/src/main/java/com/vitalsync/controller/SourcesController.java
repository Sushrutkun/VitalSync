package com.vitalsync.controller;

import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.dto.sources.SourcesListResponse;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.service.source.OAuthStateService;
import com.vitalsync.service.source.SourcesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sources")
@Tag(name = "Sources", description = "Manage user → third-party data source connections")
@Slf4j
@RequiredArgsConstructor
public class SourcesController {

  private final SourcesService sourcesService;
  private final OAuthStateService stateService;

  @Value("${vitalsync.sources.deeplink-success}")
  private String deeplinkSuccess;

  @Value("${vitalsync.sources.deeplink-failure}")
  private String deeplinkFailure;

  @GetMapping
  @Operation(summary = "List all sources with per-user connection status")
  public SourcesListResponse list(Authentication auth) {
    return new SourcesListResponse(sourcesService.listSources(auth.getName()));
  }

  @PostMapping("/{source}/connect")
  @Operation(summary = "Begin connection flow for a source")
  public ConnectResponse connect(
      @PathVariable("source") HealthSource source, Authentication auth) {
    return sourcesService.beginConnect(auth.getName(), source);
  }

  @DeleteMapping("/{source}")
  @Operation(summary = "Disconnect a source")
  public ResponseEntity<Void> disconnect(
      @PathVariable("source") HealthSource source, Authentication auth) {
    sourcesService.disconnect(auth.getName(), source);
    return ResponseEntity.noContent().build();
  }

  /**
   * OAuth2 redirect target. Not JWT-protected — security comes from the signed {@code state}.
   * Validates state, exchanges code via the adapter, then 302-redirects to a deep link.
   */
  @GetMapping("/{source}/callback")
  @Operation(summary = "OAuth2 callback (browser-only)")
  public ResponseEntity<Void> callback(
      @PathVariable("source") HealthSource source,
      @RequestParam(name = "code", required = false) String code,
      @RequestParam(name = "state", required = false) String state,
      @RequestParam(name = "error", required = false) String error) {
    if (error != null) {
      log.warn("OAuth callback error source=[{}] error=[{}]", source, error);
      return redirect(deeplinkFailure + "?source=" + source.name() + "&reason=" + enc(error));
    }
    if (code == null || state == null) {
      return redirect(deeplinkFailure + "?source=" + source.name() + "&reason=missing_params");
    }
    try {
      OAuthStateService.Verified v = stateService.verify(state);
      if (v.source() != source) {
        return redirect(deeplinkFailure + "?source=" + source.name() + "&reason=source_mismatch");
      }
      sourcesService.completeOAuth(v.userId(), source, code);
      return redirect(deeplinkSuccess + "?source=" + source.name());
    } catch (Exception e) {
      log.error("OAuth callback failed source=[{}]: {}", source, e.getMessage(), e);
      return redirect(deeplinkFailure + "?source=" + source.name() + "&reason=" + enc(e.getMessage()));
    }
  }

  private ResponseEntity<Void> redirect(String url) {
    HttpHeaders h = new HttpHeaders();
    h.setLocation(URI.create(url));
    return new ResponseEntity<>(h, HttpStatus.FOUND);
  }

  private static String enc(String s) {
    if (s == null) return "";
    return URLEncoder.encode(s, StandardCharsets.UTF_8);
  }
}
