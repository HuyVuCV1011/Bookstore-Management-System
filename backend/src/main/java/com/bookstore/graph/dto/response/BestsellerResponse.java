package com.bookstore.graph.dto.response;

public record BestsellerResponse(
        String isbn,
        String title,
        Double price,
        Double avgRating,
        String coverUrl,
        Integer totalSold,
        int rank,
        Integer ratingCount,
        Integer viewCount,
        String authorName,
        String categoryName
) {}
