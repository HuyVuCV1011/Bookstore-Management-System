package com.bookstore.service;

import com.bookstore.dto.request.ReviewRequest;
import com.bookstore.dto.request.ReviewUpdateRequest;
import com.bookstore.dto.response.RatingSummaryResponse;
import com.bookstore.dto.response.RatingAggregationResult;
import com.bookstore.entity.Book;
import com.bookstore.entity.mongodb.Review;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.graph.dto.request.RecordRatingRequest;
import com.bookstore.graph.service.GraphInteractionService;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.OrderRepository;
import com.bookstore.repository.mongodb.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final com.bookstore.repository.CustomerRepository customerRepository;
    private final BookRepository bookRepository;
    private final GraphInteractionService graphInteractionService;

    public void createReview(ReviewRequest request, UUID userId) {
        log.info("Creating review for bookId: {}, userId: {}", request.getBookId(), userId);

        // Task 5: Verify purchase before review
        var customer = customerRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Customer profile not found."));

        boolean hasPurchased = orderRepository.hasPurchasedBook(customer.getId(), request.getBookId());
        if (!hasPurchased) {
            throw new IllegalStateException("You must purchase this book before reviewing it.");
        }

        if (reviewRepository.existsByBookIdAndUserId(request.getBookId(), userId)) {
            throw new IllegalStateException("You have already reviewed this book.");
        }

        Review review = Review.builder()
                .bookId(request.getBookId())
                .userId(userId)
                .userName(customer.getFullName())
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .moderated(false)
                .build();

        Review savedReview = reviewRepository.save(review);
        log.info("Review saved successfully with ID: {}", savedReview.getId());
    }

    public void updateReview(String reviewId, UUID userId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new IllegalStateException("You can only edit your own reviews.");
        }

        review.setComment(request.getComment());
        review.setRating(request.getRating());
        review.setModerated(false); // Re-moderate after edit
        reviewRepository.save(review);
    }

    public void approveReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setModerated(true);
        reviewRepository.save(review);

        Book book = bookRepository.findById(review.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + review.getBookId()));
        graphInteractionService.recordRating(
                review.getUserId(),
                new RecordRatingRequest(
                        review.getUserId().toString(),
                        book.getIsbn(),
                        review.getRating(),
                        review.getComment()
                )
        );
    }

    public Page<Review> getReviewsByBook(Integer bookId, Integer rating, Pageable pageable) {
        // Return all reviews so the UI can show approved reviews plus the current user's pending review.
        if (rating != null) {
            return reviewRepository.findByBookIdAndRating(bookId, rating, pageable);
        }
        return reviewRepository.findByBookId(bookId, pageable);
    }

    public RatingSummaryResponse getRatingSummary(Integer bookId) {
        List<RatingAggregationResult> results = reviewRepository.aggregateRatings(List.of(bookId));
        if (results.isEmpty()) {
            return RatingSummaryResponse.builder()
                    .averageRating(0.0)
                    .totalReviews(0L)
                    .ratingDistribution(Map.of())
                    .build();
        }

        long totalReviews = 0;
        double sumRatings = 0.0;
        Map<Integer, Long> dist = new HashMap<>();

        for (RatingAggregationResult r : results) {
            int rating = r.getRating();
            long count = r.getCount();
            dist.put(rating, count);
            totalReviews += count;
            sumRatings += rating * count;
        }

        double avg = totalReviews > 0 ? sumRatings / totalReviews : 0.0;

        return RatingSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(totalReviews)
                .ratingDistribution(dist)
                .build();
    }

    public void deleteReview(String reviewId, UUID userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new IllegalStateException("You can only delete your own reviews.");
        }

        reviewRepository.deleteById(reviewId);
    }

    public Page<Review> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }

    public void deleteReviewByAdmin(String reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    public long getReviewCount() {
        return reviewRepository.count();
    }

    public Map<Integer, RatingSummaryResponse> getBulkRatingSummaries(List<Integer> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<RatingAggregationResult> allResults = reviewRepository.aggregateRatings(bookIds);
        Map<Integer, List<RatingAggregationResult>> groupedResults = allResults.stream()
                .collect(Collectors.groupingBy(RatingAggregationResult::getBookId));

        Map<Integer, RatingSummaryResponse> result = new HashMap<>();
        for (Integer bookId : bookIds) {
            List<RatingAggregationResult> bookRatings = groupedResults.getOrDefault(bookId, Collections.emptyList());
            if (bookRatings.isEmpty()) {
                result.put(bookId, RatingSummaryResponse.builder()
                        .averageRating(0.0)
                        .totalReviews(0L)
                        .ratingDistribution(Collections.emptyMap())
                        .build());
                continue;
            }

            long totalReviews = 0;
            double sumRatings = 0.0;
            Map<Integer, Long> dist = new HashMap<>();

            for (RatingAggregationResult r : bookRatings) {
                int rating = r.getRating();
                long count = r.getCount();
                dist.put(rating, count);
                totalReviews += count;
                sumRatings += rating * count;
            }

            double avg = totalReviews > 0 ? sumRatings / totalReviews : 0.0;

            result.put(bookId, RatingSummaryResponse.builder()
                    .averageRating(avg)
                    .totalReviews(totalReviews)
                    .ratingDistribution(dist)
                    .build());
        }

        return result;
    }
}
