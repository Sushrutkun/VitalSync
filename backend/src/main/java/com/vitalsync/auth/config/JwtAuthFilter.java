package com.vitalsync.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.auth.exception.AuthErrorCode;
import com.vitalsync.auth.exception.AuthException;
import com.vitalsync.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final String BEARER = "Bearer ";
  private static final List<String> SKIP_PREFIXES =
      List.of(
          "/api/v1/auth/signup",
          "/api/v1/auth/login",
          "/api/v1/auth/refresh",
          "/actuator/",
          "/v3/api-docs",
          "/swagger-ui");

  private final JwtService jwt;
  private final ObjectMapper json;

  public JwtAuthFilter(JwtService jwt, ObjectMapper json) {
    this.jwt = jwt;
    this.json = json;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return SKIP_PREFIXES.stream().anyMatch(path::startsWith);
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
      throws ServletException, IOException {
    String authHeader = req.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith(BEARER)) {
      writeError(resp, AuthErrorCode.TOKEN_INVALID, "Missing or malformed Authorization header");
      return;
    }
    String token = authHeader.substring(BEARER.length()).trim();
    try {
      Claims claims = jwt.parse(token);
      UsernamePasswordAuthenticationToken auth =
          new UsernamePasswordAuthenticationToken(claims.getSubject(), null, List.of());
      SecurityContextHolder.getContext().setAuthentication(auth);
    } catch (AuthException e) {
      writeError(resp, e.code(), e.getMessage());
      return;
    }
    chain.doFilter(req, resp);
  }

  private void writeError(HttpServletResponse resp, AuthErrorCode code, String msg)
      throws IOException {
    resp.setStatus(code.status().value());
    resp.setContentType(MediaType.APPLICATION_JSON_VALUE);
    Map<String, Object> errorBody =
        Map.of(
            "error",
            Map.of(
                "code", code.name(),
                "message", msg,
                "details", Map.of()));
    json.writeValue(resp.getOutputStream(), errorBody);
  }
}
