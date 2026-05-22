package com.bookstore.controller;

import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.InteractionEventService;
import com.bookstore.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {
    private final WishlistService wishlistService;
    private final InteractionEventService interactionEventService;

    @GetMapping
    public ResponseEntity<?> getWishlist() {
        return ResponseEntity.ok(wishlistService.getWishlist(getCurrentUserId()));
    }

    @PostMapping("/add/{bookId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Integer bookId) {
        UUID userId = getCurrentUserId();
        log.info("Adding book {} to wishlist for user {}", bookId, userId);
        wishlistService.addToWishlist(userId, bookId);

        // Track bookmark/wishlist event
        try {
            interactionEventService.trackBookmark(userId, bookId);
        } catch (Exception e) {
            log.error("Failed to track bookmark event", e);
        }

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/remove/{bookId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Integer bookId) {
        wishlistService.removeFromWishlist(getCurrentUserId(), bookId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check/{bookId}")
    public ResponseEntity<Boolean> checkWishlist(@PathVariable Integer bookId) {
        return ResponseEntity.ok(wishlistService.isInWishlist(getCurrentUserId(), bookId));
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.debug("Authentication: {}, Principal: {}", auth, auth != null ? auth.getPrincipal() : "null");

        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) auth.getPrincipal()).getUserId();
        }

        log.error("User not authenticated or principal is not CustomUserDetails. Auth: {}, Principal type: {}",
                  auth, auth != null ? auth.getPrincipal().getClass().getName() : "null");
        throw new IllegalStateException("User not authenticated");
    }
}
