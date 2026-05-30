package com.vitalsync.controller;

import com.vitalsync.dto.sources.ConnectResponse;
import com.vitalsync.dto.sources.SourcesListResponse;
import com.vitalsync.entity.HealthSource;
import com.vitalsync.service.source.SourcesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
}
