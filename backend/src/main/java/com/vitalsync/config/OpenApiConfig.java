package com.vitalsync.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI vitalSyncOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VitalSync Ingestion API")
                        .description("API for ingesting health data records into VitalSync via Kafka")
                        .version("v1.0.0"));
    }
}
