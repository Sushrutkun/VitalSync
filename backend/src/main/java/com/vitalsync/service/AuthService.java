package com.vitalsync.service;

import com.vitalsync.dto.auth.AuthResponse;
import com.vitalsync.dto.auth.AuthUserDto;
import com.vitalsync.dto.auth.LoginRequest;
import com.vitalsync.dto.auth.SignupRequest;
import com.vitalsync.entity.RefreshToken;
import com.vitalsync.entity.User;
import com.vitalsync.exception.AuthErrorCode;
import com.vitalsync.exception.AuthException;
import com.vitalsync.repository.RefreshTokenRepository;
import com.vitalsync.repository.UserRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository users;
  private final RefreshTokenRepository refreshTokens;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwt;
  private final long refreshTtlSeconds;
  private final SecureRandom random = new SecureRandom();

  public AuthService(
      UserRepository users,
      RefreshTokenRepository refreshTokens,
      PasswordEncoder passwordEncoder,
      JwtService jwt,
      @Value("${vitalsync.auth.jwt.refresh-token-ttl-seconds}") long refreshTtlSeconds) {
    this.users = users;
    this.refreshTokens = refreshTokens;
    this.passwordEncoder = passwordEncoder;
    this.jwt = jwt;
    this.refreshTtlSeconds = refreshTtlSeconds;
  }

  @Transactional
  public AuthResponse signup(SignupRequest req) {
    if (users.existsByEmail(req.getEmail())) {
      throw new AuthException(AuthErrorCode.CONFLICT, "Email already registered");
    }
    User user =
        User.builder()
            .id("user_" + shortId())
            .email(req.getEmail())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .name(req.getName())
            .build();
    users.save(user);
    return issueTokens(user);
  }

  @Transactional
  public AuthResponse login(LoginRequest req) {
    User user =
        users
            .findByEmail(req.getEmail())
            .orElseThrow(
                () ->
                    new AuthException(
                        AuthErrorCode.INVALID_CREDENTIALS, "Email or password is incorrect"));
    if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
      throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS, "Email or password is incorrect");
    }
    return issueTokens(user);
  }

  /**
   * §7.2 rotation: lookup by token id, verify secret, delete row, issue new pair. Token format on
   * the wire: "{id}.{secret_hex}". Only secret is bcrypt-hashed in DB.
   */
  @Transactional
  public AuthResponse refresh(String rawToken) {
    ParsedToken parsedToken = parse(rawToken);
    // parsedToken fields accessed via getters below
    RefreshToken refreshToken =
        refreshTokens
            .findById(parsedToken.getId())
            .orElseThrow(
                () ->
                    new AuthException(
                        AuthErrorCode.REFRESH_TOKEN_INVALID, "Refresh token not found"));

    if (!passwordEncoder.matches(parsedToken.getSecret(), refreshToken.getTokenHash())) {
      throw new AuthException(AuthErrorCode.REFRESH_TOKEN_INVALID, "Refresh token does not match");
    }
    if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
      refreshTokens.deleteById(refreshToken.getId());
      throw new AuthException(AuthErrorCode.REFRESH_TOKEN_EXPIRED, "Refresh token has expired");
    }
    refreshTokens.deleteById(refreshToken.getId());

    User user =
        users
            .findById(refreshToken.getUserId())
            .orElseThrow(
                () ->
                    new AuthException(
                        AuthErrorCode.REFRESH_TOKEN_INVALID, "User no longer exists"));
    return issueTokens(user);
  }

  @Transactional
  public void logout(String rawToken, String authUserId) {
    ParsedToken parsedToken;
    try {
      parsedToken = parse(rawToken);
    } catch (AuthException ignored) {
      return; // logout is best-effort
    }
    refreshTokens
        .findById(parsedToken.getId())
        .ifPresent(
            refreshToken -> {
              if (refreshToken.getUserId().equals(authUserId)
                  && passwordEncoder.matches(
                      parsedToken.getSecret(), refreshToken.getTokenHash())) {
                refreshTokens.deleteById(refreshToken.getId());
              }
            });
  }

  private AuthResponse issueTokens(User user) {
    String accessToken = jwt.issue(user.getId(), user.getEmail());
    String refreshTokenId = "rt_" + shortId();
    String secret = randomHex(32);
    String wire = refreshTokenId + "." + secret;
    RefreshToken refreshToken =
        RefreshToken.builder()
            .id(refreshTokenId)
            .userId(user.getId())
            .tokenHash(passwordEncoder.encode(secret))
            .expiresAt(Instant.now().plusSeconds(refreshTtlSeconds))
            .build();
    refreshTokens.save(refreshToken);
    return new AuthResponse(
        accessToken,
        wire,
        jwt.accessTtlSeconds(),
        new AuthUserDto(user.getId(), user.getEmail(), user.getName()));
  }

  private ParsedToken parse(String raw) {
    if (raw == null) {
      throw new AuthException(AuthErrorCode.REFRESH_TOKEN_INVALID, "Missing refresh token");
    }
    int dot = raw.indexOf('.');
    if (dot <= 0 || dot == raw.length() - 1) {
      throw new AuthException(AuthErrorCode.REFRESH_TOKEN_INVALID, "Malformed refresh token");
    }
    return new ParsedToken(raw.substring(0, dot), raw.substring(dot + 1));
  }

  private String randomHex(int bytes) {
    byte[] randomBytes = new byte[bytes];
    random.nextBytes(randomBytes);
    return HexFormat.of().formatHex(randomBytes);
  }

  private String shortId() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
  }

  @Data
  @AllArgsConstructor
  private static class ParsedToken {
    String id;
    String secret;
  }
}
