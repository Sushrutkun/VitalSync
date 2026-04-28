package com.vitalsync.config;

import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson tweaks for the health-sync payload.
 *
 * <p>Health Connect exposes {@code exerciseType} as a numeric enum code, so the mobile client may
 * send either a string ("UNKNOWN") or a number for {@code exerciseSessions[].type}. Allow Jackson
 * to coerce numeric scalars into the {@code String} field rather than rejecting the request.
 */
@Configuration
public class JacksonConfig {

  @Bean
  Jackson2ObjectMapperBuilderCustomizer scalarToStringCoercion() {
    return builder ->
        builder.postConfigurer(
            mapper ->
                mapper
                    .coercionConfigFor(LogicalType.Textual)
                    .setCoercion(CoercionInputShape.Integer, CoercionAction.TryConvert)
                    .setCoercion(CoercionInputShape.Float, CoercionAction.TryConvert));
  }
}
