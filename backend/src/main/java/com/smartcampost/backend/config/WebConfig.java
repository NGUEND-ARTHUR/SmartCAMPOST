package com.smartcampost.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
    var mapping = registry.addMapping("/api/**")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("Authorization")
        .allowCredentials(true);

    String env = System.getenv("CORS_ALLOWED_ORIGINS");
    if (env != null && !env.isBlank()) {
        List<String> origins = Arrays.stream(env.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
        mapping.allowedOrigins(origins.toArray(new String[0]));
    } else {
        mapping.allowedOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176"
        );
        // Allow deployed previews / Vercel domains when env isn't set.
        mapping.allowedOriginPatterns("*");
    }
    }
}
