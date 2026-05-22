package com.bookstore.controller;

import com.bookstore.dto.request.UpdateProfileRequest;
import com.bookstore.dto.response.ProfileResponse;
import com.bookstore.security.CurrentUser;
import com.bookstore.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@CurrentUser UUID userId) {
        log.debug("GET /api/profile - userId: {}", userId);
        ProfileResponse profile = profileService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @CurrentUser UUID userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        log.debug("PUT /api/profile - userId: {}", userId);
        ProfileResponse profile = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(profile);
    }
}
