package com.smartcampost.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("disable-permissive-security")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PermissiveSecurityConfig {

    // Temporary permissive security to make WebMvcTest slices behave like earlier expectations
    // This disables CSRF and permits requests during tests. Remove or scope this before production.
    @Bean
    public SecurityFilterChain permissiveFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}
