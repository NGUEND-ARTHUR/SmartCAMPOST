package com.smartcampost.backend.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtService.validateToken(token) &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                Claims claims = jwtService.extractClaims(token);

                // ✅ Your token: subject = userId (UUID)
                String userId = claims.getSubject();

                // ✅ Your token also includes phone/role/entityId
                String phone = claims.get("phone", String.class);
                String role = claims.get("role", String.class);

                // ✅ principal: prefer phone (more useful in controllers/services)
                String principal = (phone != null && !phone.trim().isEmpty())
                        ? phone.trim()
                        : userId;

                // ✅ Build authorities: ROLE_ADMIN / ROLE_STAFF / ROLE_FINANCE / ROLE_RISK ...
                List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                if (role != null && !role.trim().isEmpty()) {
                    String normalized = role.trim().toUpperCase();
                    String authority = normalized.startsWith("ROLE_") ? normalized : "ROLE_" + normalized;
                    authorities = List.of(new SimpleGrantedAuthority(authority));
                }

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                authorities
                        );

                // keep default request details
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
