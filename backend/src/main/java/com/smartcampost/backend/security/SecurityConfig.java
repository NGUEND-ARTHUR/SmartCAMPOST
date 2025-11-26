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

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // ============================
                        //   PUBLIC AUTH ENDPOINTS
                        // ============================
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",

                                "/api/auth/send-otp",
                                "/api/auth/verify-otp",

                                "/api/auth/login/otp/request",
                                "/api/auth/login/otp/confirm",

                                "/api/auth/password/reset/request",
                                "/api/auth/password/reset/confirm"
                        ).permitAll()

                        // ============================
                        //   SPRINT 3 : Agent Module
                        // ============================
                        // Pour l'instant, ANY authenticated user peut gérer les agents.
                        // On restreindra plus tard (ADMIN only).
                        .requestMatchers("/api/agents/**").authenticated()

                        // SPRINT 2 : Clients (profil)
                        .requestMatchers("/api/clients/**").authenticated()

                        // ============================
                        //   ANY OTHER REQUEST MUST BE AUTHENTICATED
                        // ============================
                        .anyRequest().authenticated()
                );

        // Ajouter le filtre JWT
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
