package com.bookstore.graph.dto.response;

public record CategoryGrowthResponse(
        String categoryId,
        String categoryName,
        Double revenue,
        Long customerCount,
        Long totalSold,
        String latestPurchasedAt
) {}
