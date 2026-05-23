package com.bookstore.security;

import com.bookstore.config.SecurityConfig;
import com.bookstore.controller.AuthController;
import com.bookstore.dto.response.UserResponse;
import com.bookstore.entity.Role;
import com.bookstore.repository.cassandra.SessionRepository;
import com.bookstore.service.*;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private CartService cartService;

    @MockBean
    private GuestCartService guestCartService;

    @MockBean
    private RefreshTokenCookieService refreshTokenCookieService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private SessionRepository sessionRepository;

    @Test
    void meEndpoint_Anonymous_IsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meEndpoint_Authenticated_ReturnsUserData() throws Exception {
        UUID userId = UUID.randomUUID();
        CustomUserDetails userDetails = new CustomUserDetails(
                userId,
                "test@example.com",
                "password",
                true,
                Collections.emptyList()
        );

        UserResponse userResponse = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .role(Role.CUSTOMER)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        Mockito.when(authService.getCurrentUser(userId)).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/me")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.id").value(userId.toString()));
    }

    @Test
    void meEndpoint_CassandraDown_AdminUser_FailsClosed() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String token = "valid-token";

        Mockito.when(jwtService.validateToken(token)).thenReturn(true);
        Mockito.when(jwtService.extractUserId(token)).thenReturn(userId);
        Mockito.when(jwtService.extractSessionId(token)).thenReturn(sessionId);

        Mockito.when(sessionRepository.findById(sessionId))
                .thenThrow(new RuntimeException("Cassandra connection timed out"));

        CustomUserDetails adminDetails = new CustomUserDetails(
                userId,
                "admin@example.com",
                "password",
                true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        Mockito.when(customUserDetailsService.loadUserById(userId)).thenReturn(adminDetails);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Service Unavailable"));
    }

    @Test
    void meEndpoint_CassandraDown_CustomerUser_FailsOpen() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String token = "valid-token";

        Mockito.when(jwtService.validateToken(token)).thenReturn(true);
        Mockito.when(jwtService.extractUserId(token)).thenReturn(userId);
        Mockito.when(jwtService.extractSessionId(token)).thenReturn(sessionId);

        Mockito.when(sessionRepository.findById(sessionId))
                .thenThrow(new RuntimeException("Cassandra connection timed out"));

        CustomUserDetails customerDetails = new CustomUserDetails(
                userId,
                "customer@example.com",
                "password",
                true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        Mockito.when(customUserDetailsService.loadUserById(userId)).thenReturn(customerDetails);

        UserResponse userResponse = UserResponse.builder()
                .id(userId)
                .email("customer@example.com")
                .role(Role.CUSTOMER)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
        Mockito.when(authService.getCurrentUser(userId)).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("customer@example.com"));
    }
}
