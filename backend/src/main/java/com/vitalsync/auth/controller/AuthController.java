package com.vitalsync.auth.controller;

import com.vitalsync.auth.dto.*;
import com.vitalsync.auth.exception.AuthErrorCode;
import com.vitalsync.auth.exception.AuthException;
import com.vitalsync.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/signup")
  public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(req));
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {
    return authService.login(req);
  }

  @PostMapping("/refresh")
  public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
    return authService.refresh(req.refreshToken());
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @Valid @RequestBody LogoutRequest req, Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      throw new AuthException(AuthErrorCode.TOKEN_INVALID, "Authentication required");
    }
    authService.logout(req.refreshToken(), authentication.getName());
    return ResponseEntity.noContent().build();
  }
}
