package com.vitalsync.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

/**
 * Per-user, per-source connection state.
 *
 * <p>All token/credential columns are encrypted at rest via {@code CredentialVault}.
 */
@Entity
@Table(
    name = "user_source_credential",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_user_source",
            columnNames = {"user_id", "source"}),
    indexes = {
      @Index(name = "idx_usc_status_source", columnList = "status,source"),
      @Index(name = "idx_usc_user", columnList = "user_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSourceCredential {

  public enum Status {
    NOT_CONNECTED,
    CONNECTED,
    EXPIRED,
    REVOKED,
    ERROR
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false, length = 64)
  private String userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "source", nullable = false, length = 32)
  private HealthSource source;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private Status status;

  @Column(name = "access_token_enc", columnDefinition = "text")
  private String accessTokenEnc;

  @Column(name = "refresh_token_enc", columnDefinition = "text")
  private String refreshTokenEnc;

  /** Encrypted JSON blob — e.g. WHOOP {email, password}. */
  @Column(name = "credentials_json_enc", columnDefinition = "text")
  private String credentialsJsonEnc;

  @Column(name = "scopes", length = 512)
  private String scopes;

  @Column(name = "expires_at")
  private Instant expiresAt;

  @Column(name = "connected_at")
  private Instant connectedAt;

  @Column(name = "last_polled_at")
  private Instant lastPolledAt;

  @Column(name = "last_error", columnDefinition = "text")
  private String lastError;
}
