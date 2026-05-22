package com.bookstore.graph.dto.response;

public record InfluentialBookResponse(
        String isbn,
        String title,
        Double avgRating,
        String coverUrl,
        Double influenceScore
) {}
