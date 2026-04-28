package com.vitalsync.auth.service;

import com.vitalsync.auth.dto.*;
import com.vitalsync.auth.entity.RefreshToken;
import com.vitalsync.auth.entity.User;
import com.vitalsync.auth.exception.AuthErrorCode;
import com.vitalsync.auth.exception.AuthException;
import com.vitalsync.auth.repository.RefreshTokenRepository;
import com.vitalsync.auth.repository.UserRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
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
    if (users.existsByEmail(req.email())) {
      throw new AuthException(AuthErrorCode.CONFLICT, "Email already registered");
    }
    User u =
        User.builder()
            .id("user_" + shortId())
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .name(req.name())
            .build();
    users.save(u);
    return issueTokens(u);
  }

  @Transactional
  public AuthResponse login(LoginRequest req) {
    User u =
        users
            .findByEmail(req.email())
            .orElseThrow(
                () ->
                    new AuthException(
                        AuthErrorCode.INVALID_CREDENTIALS, "Email or password is incorrect"));
    if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
      throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS, "Email or password is incorrect");
    }
    return issueTokens(u);
  }

  /**
   * §7.2 rotation: lookup by token id, verify secret, delete row, issue new pair. Token format on
   * the wire: "{id}.{secret_hex}". Only secret is bcrypt-hashed in DB.
   */
  @Transactional
  public AuthResponse refresh(String rawToken) {
    ParsedToken p = parse(rawToken);
    RefreshToken match =
        refreshTokens
            .findById(p.id)
            .orElseThrow(
                () ->
                    new AuthException(
                        AuthErrorCode.REFRESH_TOKEN_INVALID, "Refresh token not found"));

    if (!passwordEncoder.matches(p.secret, match.getTokenHash())) {
      throw new AuthException(AuthErrorCode.REFRESH_TOKEN_INVALID, "Refresh token does not match");
    }
    if (match.getExpiresAt().isBefore(Instant.now())) {
      refreshTokens.deleteById(match.getId());
      throw new AuthException(AuthErrorCode.REFRESH_TOKEN_EXPIRED, "Refresh token has expired");
    }
    refreshTokens.deleteById(match.getId());

    User u =
        users
            .findById(match.getUserId())
            .orElseThrow(
                () ->
                    new AuthException(
                        AuthErrorCode.REFRESH_TOKEN_INVALID, "User no longer exists"));
    return issueTokens(u);
  }

  @Transactional
  public void logout(String rawToken, String authUserId) {
    ParsedToken p;
    try {
      p = parse(rawToken);
    } catch (AuthException ignored) {
      return; // logout is best-effort
    }
    refreshTokens
        .findById(p.id)
        .ifPresent(
            rt -> {
              if (rt.getUserId().equals(authUserId)
                  && passwordEncoder.matches(p.secret, rt.getTokenHash())) {
                refreshTokens.deleteById(rt.getId());
              }
            });
  }

  private AuthResponse issueTokens(User u) {
    String accessToken = jwt.issue(u.getId(), u.getEmail());
    String rtId = "rt_" + shortId();
    String secret = randomHex(32);
    String wire = rtId + "." + secret;
    RefreshToken rt =
        RefreshToken.builder()
            .id(rtId)
            .userId(u.getId())
            .tokenHash(passwordEncoder.encode(secret))
            .expiresAt(Instant.now().plusSeconds(refreshTtlSeconds))
            .build();
    refreshTokens.save(rt);
    return new AuthResponse(
        accessToken,
        wire,
        jwt.accessTtlSeconds(),
        new UserDto(u.getId(), u.getEmail(), u.getName()));
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
    byte[] b = new byte[bytes];
    random.nextBytes(b);
    return HexFormat.of().formatHex(b);
  }

  private String shortId() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
  }

  private record ParsedToken(String id, String secret) {}
}
