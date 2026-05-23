package com.bookstore.service;

import com.bookstore.dto.response.RatingAggregationResult;
import com.bookstore.dto.response.RatingSummaryResponse;
import com.bookstore.repository.mongodb.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceAggregationTest {

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void getRatingSummary_Success() {
        Integer bookId = 1;
        List<RatingAggregationResult> aggResults = List.of(
                new RatingAggregationResult(bookId, 5, 3L),
                new RatingAggregationResult(bookId, 4, 1L)
        );

        when(reviewRepository.aggregateRatings(List.of(bookId))).thenReturn(aggResults);

        RatingSummaryResponse summary = reviewService.getRatingSummary(bookId);

        assertNotNull(summary);
        assertEquals(4L, summary.getTotalReviews());
        assertEquals(4.75, summary.getAverageRating(), 0.001);
        assertEquals(3L, summary.getRatingDistribution().get(5));
        assertEquals(1L, summary.getRatingDistribution().get(4));
    }

    @Test
    void getRatingSummary_Empty_ReturnsZeroes() {
        Integer bookId = 1;
        when(reviewRepository.aggregateRatings(List.of(bookId))).thenReturn(Collections.emptyList());

        RatingSummaryResponse summary = reviewService.getRatingSummary(bookId);

        assertNotNull(summary);
        assertEquals(0L, summary.getTotalReviews());
        assertEquals(0.0, summary.getAverageRating());
        assertTrue(summary.getRatingDistribution().isEmpty());
    }

    @Test
    void getBulkRatingSummaries_Success() {
        List<Integer> bookIds = List.of(1, 2);
        List<RatingAggregationResult> aggResults = List.of(
                new RatingAggregationResult(1, 5, 2L),
                new RatingAggregationResult(2, 4, 3L)
        );

        when(reviewRepository.aggregateRatings(bookIds)).thenReturn(aggResults);

        Map<Integer, RatingSummaryResponse> summaries = reviewService.getBulkRatingSummaries(bookIds);

        assertNotNull(summaries);
        assertEquals(2, summaries.size());

        RatingSummaryResponse summary1 = summaries.get(1);
        assertEquals(2L, summary1.getTotalReviews());
        assertEquals(5.0, summary1.getAverageRating());

        RatingSummaryResponse summary2 = summaries.get(2);
        assertEquals(3L, summary2.getTotalReviews());
        assertEquals(4.0, summary2.getAverageRating());
    }
}
