package com.bookstore.controller;

import com.bookstore.dto.request.CartItemRequest;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.CartService;
import com.bookstore.service.GuestCartService;
import com.bookstore.service.InteractionEventService;
import com.bookstore.util.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;
    private final GuestCartService guestCartService;
    private final InteractionEventService interactionEventService;

    private static final String SESSION_ATTRIBUTE = "guestSessionId";

    @GetMapping
    public ResponseEntity<?> getCart(HttpServletRequest request, HttpServletResponse response) {
        UUID userId = getCurrentUserId();
        if (userId != null) {
            return ResponseEntity.ok(cartService.getCart(userId));
        }

        // Guest user - get or create session
        String sessionId = getOrCreateGuestSession(request, response);
        return ResponseEntity.ok(guestCartService.getCart(sessionId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(
            @Valid @RequestBody CartItemRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        UUID userId = getCurrentUserId();
        if (userId != null) {
            cartService.addToCart(userId, request);
            // Track add to cart event
            try {
                interactionEventService.trackAddToCart(userId, request.getBookId(), request.getQuantity());
            } catch (Exception e) {
                // Don't fail the request if tracking fails
            }
        } else {
            // Guest user - get or create session and refresh cookie
            String sessionId = getOrCreateGuestSession(httpRequest, httpResponse);
            guestCartService.addToCart(sessionId, request);
            CookieUtils.refreshCookieExpiration(httpResponse, sessionId);
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateQuantity(
            @Valid @RequestBody CartItemRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        UUID userId = getCurrentUserId();
        if (userId != null) {
            cartService.updateQuantity(userId, request);
        } else {
            String sessionId = getOrCreateGuestSession(httpRequest, httpResponse);
            guestCartService.updateQuantity(sessionId, request);
            CookieUtils.refreshCookieExpiration(httpResponse, sessionId);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        UUID userId = getCurrentUserId();
        if (userId != null) {
            cartService.clearCart(userId);
        } else {
            String sessionId = getOrCreateGuestSession(httpRequest, httpResponse);
            guestCartService.clearCart(sessionId);
            // Delete the cookie when cart is cleared
            httpResponse.addCookie(CookieUtils.deleteGuestSessionCookie());
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/item/{bookId}")
    public ResponseEntity<?> removeFromCart(
            @PathVariable Integer bookId,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        UUID userId = getCurrentUserId();
        if (userId != null) {
            cartService.removeFromCart(userId, bookId);
        } else {
            String sessionId = getOrCreateGuestSession(httpRequest, httpResponse);
            guestCartService.removeFromCart(sessionId, bookId);
            CookieUtils.refreshCookieExpiration(httpResponse, sessionId);
        }
        return ResponseEntity.ok().build();
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) auth.getPrincipal()).getUserId();
        }
        return null;
    }

    /**
     * Get existing guest session from request attribute (set by interceptor)
     * or create new session and set cookie
     */
    private String getOrCreateGuestSession(HttpServletRequest request, HttpServletResponse response) {
        // Check if interceptor already extracted a session
        String sessionId = (String) request.getAttribute(SESSION_ATTRIBUTE);

        if (sessionId == null) {
            // No existing session - create new one
            sessionId = CookieUtils.generateSessionId();
            response.addCookie(CookieUtils.createGuestSessionCookie(sessionId));
            log.info("Created new guest session: {}", sessionId);
        } else if (!CookieUtils.hasCookie(request, "GUEST_SESSION_ID")) {
            // Session came from header (migration case) - set cookie
            response.addCookie(CookieUtils.createGuestSessionCookie(sessionId));
            log.info("Migrated guest session to cookie: {}", sessionId);
        }

        return sessionId;
    }
}
