package com.vitalsync.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

/**
 * Encrypts/decrypts third-party credentials at rest (OAuth tokens, WHOOP passwords, etc).
 *
 * <p>Master key from env {@code VITALSYNC_CRED_KEY}; salt from {@code VITALSYNC_CRED_SALT} (hex).
 * Uses Spring Security's {@code Encryptors.delux} — AES-256-CBC with HMAC-SHA-256.
 */
@Service
@Slf4j
public class CredentialVault {

  private final TextEncryptor encryptor;

  public CredentialVault(
      @Value("${vitalsync.crypto.master-key}") String masterKey,
      @Value("${vitalsync.crypto.salt}") String saltHex) {
    this.encryptor = Encryptors.delux(masterKey, saltHex);
    if ("dev-key-do-not-use-in-prod".equals(masterKey)) {
      log.warn("CredentialVault using default dev key. Set VITALSYNC_CRED_KEY in production.");
    }
  }

  public String encrypt(String plaintext) {
    if (plaintext == null) return null;
    return encryptor.encrypt(plaintext);
  }

  public String decrypt(String ciphertext) {
    if (ciphertext == null) return null;
    return encryptor.decrypt(ciphertext);
  }
}
