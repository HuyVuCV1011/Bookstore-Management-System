package com.bookstore.graph.dto.response;

public record BookReviewResponse(
        String customerName,
        Double score,
        String reviewText,
        String ratedAt
) {}
