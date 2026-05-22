package com.bookstore.security;

import com.bookstore.entity.SessionEntity;
import com.bookstore.repository.SessionRepository;
import com.bookstore.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final SessionRepository sessionRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (jwtService.validateToken(token)) {
                    UUID userId = jwtService.extractUserId(token);
                    UUID sessionId = jwtService.extractSessionId(token);

                    // Check if session is revoked (if sessionId exists in token)
                    if (sessionId != null) {
                        try {
                            Optional<SessionEntity> sessionOpt = sessionRepository.findById(sessionId);
                            if (sessionOpt.isPresent()) {
                                SessionEntity session = sessionOpt.get();

                                // Reject if session is revoked
                                if (Boolean.TRUE.equals(session.getRevoked())) {
                                    log.debug("Session {} is revoked, rejecting request", sessionId);
                                    filterChain.doFilter(request, response);
                                    return;
                                }

                                // Reject if session is expired
                                if (session.getExpiresAt().isBefore(Instant.now())) {
                                    log.debug("Session {} is expired, rejecting request", sessionId);
                                    filterChain.doFilter(request, response);
                                    return;
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to check session validity for sessionId: {}", sessionId, e);
                            // Continue anyway - don't fail request if Cassandra is down
                        }
                    }

                    UserDetails userDetails = userDetailsService.loadUserById(userId);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // Token validation failed, continue without authentication
            }
        }

        filterChain.doFilter(request, response);
    }
}
