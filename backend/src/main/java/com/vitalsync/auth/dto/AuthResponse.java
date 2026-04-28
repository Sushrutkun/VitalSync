package com.vitalsync.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, long expiresIn, UserDto user) {}
