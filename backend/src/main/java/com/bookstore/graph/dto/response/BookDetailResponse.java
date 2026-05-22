package com.bookstore.graph.dto.response;

public record BookDetailResponse(
        String isbn,
        String title,
        String description,
        Double price,
        Double avgRating,
        Integer ratingCount,
        Integer purchaseCount,
        Integer viewCount,
        String coverUrl,
        String status,
        String language,
        Integer publishedYear,
        String authorId,
        String authorName,
        String categoryId,
        String categoryName,
        String publisherId,
        String publisherName
) {}
