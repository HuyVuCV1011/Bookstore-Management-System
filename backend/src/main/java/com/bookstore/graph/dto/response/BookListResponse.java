package com.bookstore.graph.dto.response;

public record BookListResponse(
        String isbn,
        String title,
        Double price,
        Double avgRating,
        Integer ratingCount,
        Integer purchaseCount,
        Integer viewCount,
        String coverUrl,
        String categoryId,
        String categoryName,
        String authorName,
        String publisherName,
        Integer publishedYear,
        String language
) {}
