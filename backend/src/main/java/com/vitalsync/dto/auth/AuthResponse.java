package com.vitalsync.dto.auth;

public record AuthResponse(
    String accessToken, String refreshToken, long expiresIn, AuthUserDto user) {}
