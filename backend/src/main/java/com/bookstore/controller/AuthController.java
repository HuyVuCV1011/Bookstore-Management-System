package com.bookstore.controller;

import com.bookstore.dto.request.LoginRequest;
import com.bookstore.dto.request.RegisterRequest;
import com.bookstore.dto.response.LoginResponse;
import com.bookstore.dto.response.MessageResponse;
import com.bookstore.dto.response.TokenResponse;
import com.bookstore.dto.response.UserResponse;
import com.bookstore.service.AuthService;
import com.bookstore.service.CartService;
import com.bookstore.service.GuestCartService;
import com.bookstore.service.JwtService;
import com.bookstore.service.RateLimitService;
import com.bookstore.util.CookieUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final RateLimitService rateLimitService;
    private final CartService cartService;
    private final GuestCartService guestCartService;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());
        try {
            UserResponse userResponse = authService.register(request);
            log.info("Registration successful for email: {}, userId: {}", request.getEmail(), userResponse.getId());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(MessageResponse.builder()
                            .message("Registration successful")
                            .build());
        } catch (Exception e) {
            log.error("Registration failed for email: {}, error: {}", request.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String ipAddress = getClientIP(httpRequest);
        log.info("Login attempt for email: {} from IP: {}", request.getEmail(), ipAddress);

        rateLimitService.checkRateLimit(ipAddress);

        try {
            LoginResponse response = authService.login(request);
            log.info("Login successful for email: {}, userId: {}", request.getEmail(), response.getUser().getId());

            // Set refresh token cookie
            Cookie refreshCookie = new Cookie("refreshToken", response.getRefreshToken());
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(false); // Set to true in production with HTTPS
            refreshCookie.setPath("/");
            refreshCookie.setMaxAge(request.isRememberMe() ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60);
            httpResponse.addCookie(refreshCookie);
            log.debug("Refresh token cookie set with maxAge: {} seconds", refreshCookie.getMaxAge());

            // Auto-merge guest cart if exists
            Optional<String> guestSessionId = CookieUtils.getGuestSessionIdFromCookies(httpRequest);
            if (guestSessionId.isPresent()) {
                try {
                    UUID userId = response.getUser().getId();
                    Map<Object, Object> guestCart = guestCartService.getCart(guestSessionId.get());

                    if (guestCart != null && !guestCart.isEmpty()) {
                        cartService.mergeCart(userId, guestCart);
                        guestCartService.clearCart(guestSessionId.get());
                        log.info("Merged guest cart for session {} into user cart {}", guestSessionId.get(), userId);
                    }

                    // Delete guest session cookie
                    httpResponse.addCookie(CookieUtils.deleteGuestSessionCookie());
                    log.debug("Deleted guest session cookie after merge");
                } catch (Exception e) {
                    // Don't fail login if cart merge fails
                    log.error("Failed to merge guest cart: {}", e.getMessage(), e);
                }
            }

            rateLimitService.clearAttempts(ipAddress);

            // Don't send refresh token in response body
            response.setRefreshToken(null);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed for email: {} from IP: {}, error: {}", request.getEmail(), ipAddress, e.getMessage());
            rateLimitService.recordFailedAttempt(ipAddress);
            throw e;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        log.info("Token refresh attempt, token present: {}", refreshToken != null);
        try {
            TokenResponse response = authService.refreshAccessToken(refreshToken);
            log.info("Token refresh successful");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse httpResponse
    ) {
        log.info("Logout attempt, token present: {}", refreshToken != null);
        try {
            authService.logout(refreshToken);

            Cookie refreshCookie = new Cookie("refreshToken", null);
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(false);
            refreshCookie.setPath("/api/auth/refresh");
            refreshCookie.setMaxAge(0);
            httpResponse.addCookie(refreshCookie);

            log.info("Logout successful");
            return ResponseEntity.ok(MessageResponse.builder()
                    .message("Logged out successfully")
                    .build());
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @RequestHeader("Authorization") String authHeader
    ) {
        log.debug("Get current user attempt");
        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            UUID userId = jwtService.extractUserId(token);
            log.debug("Extracted userId: {}", userId);

            UserResponse userResponse = authService.getCurrentUser(userId);
            log.info("Get current user successful for userId: {}", userId);
            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            log.error("Get current user failed: {}", e.getMessage());
            throw e;
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
