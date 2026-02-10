package com.smartcampost.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable CORS in Spring Security
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // ===================================================
                        //                    PUBLIC AUTH ROUTES
                        // ===================================================
                        .requestMatchers(
                            "/actuator/**",
                            "/api/payments/mtn/**",
                            "/api/track/**",
                            "/api/auth/register",
                            "/api/auth/login",
                            "/api/auth/send-otp",
                            "/api/auth/verify-otp",
                            "/api/auth/login/otp/request",
                            "/api/auth/login/otp/confirm",
                            "/api/auth/password/reset/request",
                            "/api/auth/password/reset/confirm"
                        ).permitAll()

                        // ===================================================
                        //                    DASHBOARD MODULE
                        // ===================================================
                        .requestMatchers("/api/dashboard/**")
                        .authenticated()

                        // ===================================================
                        //                    ADMIN / FINANCE / RISK MODULES
                        // ===================================================
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        .requestMatchers("/api/finance/**")
                        .hasAnyRole("FINANCE", "ADMIN")

                        .requestMatchers("/api/risk/**")
                        .hasAnyRole("RISK", "ADMIN")

                        // ===================================================
                        //                    CLIENT MODULE
                        //   View/update profile, list my parcels, etc.
                        // ===================================================
                        .requestMatchers("/api/clients/**")
                        .hasAnyRole("CLIENT", "ADMIN", "STAFF")

                        // ===================================================
                        //                    AGENT MODULE
                        //   Creating agents, assigning agencies, etc.
                        // ===================================================
                        .requestMatchers("/api/agents/**")
                        .hasAnyRole("ADMIN", "STAFF")

                        // ===================================================
                        //                 STAFF MODULE
                        // ===================================================
                        .requestMatchers("/api/staff/**")
                        .hasRole("ADMIN")

                        // ===================================================
                        //                 COURIER MODULE
                        // ===================================================
                        .requestMatchers("/api/couriers/**")
                        .hasAnyRole("ADMIN", "STAFF")

                        // ===================================================
                        //                 PARCEL MODULE
                        //  Require authentication for all parcel endpoints
                        // ===================================================
                        .requestMatchers("/api/parcels/**")
                        .authenticated()

                        // ===================================================
                        //                 PICKUP MODULE
                        //   Client schedules, Staff assigns, Courier updates
                        // ===================================================
                        .requestMatchers("/api/pickups/**")
                        .authenticated()

                        // ===================================================
                        //                 DELIVERY MODULE (SPRINT 14)
                        //   OTP + final delivery confirmation
                        //   Only COURIER / AGENT / STAFF / ADMIN
                        // ===================================================
                        .requestMatchers("/api/delivery/**")
                        .hasAnyRole("COURIER", "AGENT", "STAFF", "ADMIN")

                        // ===================================================
                        //                 TARIFF & PRICING
                        // ===================================================
                        .requestMatchers("/api/tariffs/**")
                        .hasAnyRole("ADMIN", "STAFF")

                        .requestMatchers("/api/pricing/**")
                        .authenticated()

                        // ===================================================
                        //                 PAYMENT MODULE
                        // ===================================================
                        .requestMatchers("/api/payments/**")
                        .authenticated()

                        // ===================================================
                        //                 SCAN EVENTS (Tracking)
                        //   AGENT / COURIER / STAFF / ADMIN can scan
                        // ===================================================
                        .requestMatchers("/api/scan-events/**")
                        .hasAnyRole("ADMIN", "STAFF", "AGENT", "COURIER")

                        // ===================================================
                        //                 NOTIFICATION MODULE
                        // ===================================================
                        .requestMatchers("/api/notifications/**")
                        .hasAnyRole("ADMIN", "STAFF")

                        // ===================================================
                        //                 SPRINT 13 MODULES
                        // ===================================================

                        // --- Support / Ticketing ---
                        .requestMatchers("/api/support/**")
                        .authenticated()

                        // --- Refund & Chargebacks ---
                        .requestMatchers("/api/refunds/**")
                        .hasAnyRole("ADMIN", "FINANCE", "STAFF")

                        // --- Compliance / AML ---
                        .requestMatchers("/api/compliance/**")
                        .hasAnyRole("ADMIN", "RISK", "STAFF")

                        // --- Analytics / AI ---
                        .requestMatchers("/api/analytics/**")
                        .hasAnyRole("ADMIN", "STAFF")

                        // --- Geolocation Routing ---
                        .requestMatchers("/api/geolocation/**")
                        .authenticated()

                        // --- USSD Gateway ---
                        .requestMatchers("/api/ussd/**")
                        .permitAll()

                        // ===================================================
                        //               ANY OTHER REQUEST
                        // ===================================================
                        .anyRequest().authenticated()
                );

        // Add JWT filter BEFORE UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow origins from environment variable CORS_ALLOWED_ORIGINS (comma-separated),
        // fall back to localhost dev ports. If not provided, allow all origins via patterns.
        String env = System.getenv("CORS_ALLOWED_ORIGINS");
        if (env != null && !env.isBlank()) {
            List<String> origins = Arrays.stream(env.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            configuration.setAllowedOrigins(origins);
        } else {
            configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176"
            ));
            // also allow all origin patterns (useful for deployed previews)
            configuration.setAllowedOriginPatterns(List.of("*"));
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
