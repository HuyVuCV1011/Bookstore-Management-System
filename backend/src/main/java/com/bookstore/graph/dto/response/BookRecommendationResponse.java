package com.bookstore.graph.dto.response;

public record BookRecommendationResponse(
        String isbn,
        String title,
        Double price,
        Double avgRating,
        String coverUrl,
        Double score,
        String basis   // nullable: "category" | "author" | "collaborative" | "co-purchase"
) {}
