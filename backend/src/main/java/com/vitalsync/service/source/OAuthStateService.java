package com.vitalsync.service.source;

import com.vitalsync.entity.HealthSource;
import com.vitalsync.exception.AuthErrorCode;
import com.vitalsync.exception.AuthException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Signs/verifies the OAuth {@code state} parameter as a short-lived JWT bound to
 * (userId, source). Prevents CSRF and ensures the callback completes for the same user
 * who initiated the connect.
 */
@Service
public class OAuthStateService {

  private final SecretKey key;
  private final long ttlSeconds;

  public OAuthStateService(
      @Value("${vitalsync.auth.jwt.secret}") String secret,
      @Value("${vitalsync.sources.state-ttl-seconds:600}") long ttlSeconds) {
    // Derive a separate key for OAuth state by hashing the auth secret with a domain tag,
    // so a leaked state token can never be used as an access token.
    byte[] derived = sha256(("oauth-state:" + secret).getBytes(StandardCharsets.UTF_8));
    this.key = Keys.hmacShaKeyFor(derived);
    this.ttlSeconds = ttlSeconds;
  }

  public String sign(String userId, HealthSource source) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(userId)
        .claim("src", source.name())
        .claim("nonce", UUID.randomUUID().toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(ttlSeconds)))
        .signWith(key)
        .compact();
  }

  public Verified verify(String stateToken) {
    try {
      Claims c =
          Jwts.parser().verifyWith(key).build().parseSignedClaims(stateToken).getPayload();
      return new Verified(c.getSubject(), HealthSource.valueOf(c.get("src", String.class)));
    } catch (ExpiredJwtException e) {
      throw new AuthException(AuthErrorCode.TOKEN_EXPIRED, "OAuth state has expired");
    } catch (JwtException | IllegalArgumentException e) {
      throw new AuthException(AuthErrorCode.TOKEN_INVALID, "OAuth state is invalid");
    }
  }

  public record Verified(String userId, HealthSource source) {}

  private static byte[] sha256(byte[] in) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(in);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
