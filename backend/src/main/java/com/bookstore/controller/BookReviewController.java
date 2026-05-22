package com.bookstore.controller;

import com.bookstore.dto.request.ReviewRequest;
import com.bookstore.dto.request.ReviewUpdateRequest;
import com.bookstore.dto.response.RatingSummaryResponse;
import com.bookstore.entity.mongodb.Review;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class BookReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewRequest request) {
        reviewService.createReview(request, getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<Page<Review>> getReviews(
            @PathVariable Integer bookId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        Sort sortObj = parseReviewSort(sort);
        return ResponseEntity.ok(reviewService.getReviewsByBook(bookId, rating, PageRequest.of(page, size, sortObj)));
    }

    @GetMapping("/book/{bookId}/summary")
    public ResponseEntity<RatingSummaryResponse> getSummary(@PathVariable Integer bookId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(bookId));
    }

    @PostMapping("/summaries")
    public ResponseEntity<java.util.Map<Integer, RatingSummaryResponse>> getBulkSummaries(@RequestBody java.util.List<Integer> bookIds) {
        return ResponseEntity.ok(reviewService.getBulkRatingSummaries(bookIds));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<Review>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reviewService.getAllReviews(PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable String reviewId) {
        reviewService.deleteReview(reviewId, getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable String reviewId, @Valid @RequestBody ReviewUpdateRequest request) {
        reviewService.updateReview(reviewId, getCurrentUserId(), request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/admin/{reviewId}/approve")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<?> approveReview(@PathVariable String reviewId) {
        reviewService.approveReview(reviewId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/admin/{reviewId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<?> deleteReviewByAdmin(@PathVariable String reviewId) {
        reviewService.deleteReviewByAdmin(reviewId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test/count")
    public ResponseEntity<?> getReviewCount() {
        long count = reviewService.getReviewCount();
        return ResponseEntity.ok(java.util.Map.of(
            "totalReviews", count,
            "message", "MongoDB connection is working"
        ));
    }

    private Sort parseReviewSort(String sort) {
        String[] sortParts = sort == null ? new String[0] : sort.split(",", 2);
        String field = sortParts.length > 0 ? sortParts[0] : "createdAt";
        String direction = sortParts.length > 1 ? sortParts[1] : "desc";

        if (!field.equals("createdAt") && !field.equals("rating")) {
            field = "createdAt";
        }

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(sortDirection, field);
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) auth.getPrincipal()).getUserId();
        }
        return null;
    }
}
