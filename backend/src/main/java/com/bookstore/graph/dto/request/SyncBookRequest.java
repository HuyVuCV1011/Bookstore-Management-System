package com.bookstore.graph.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SyncBookRequest(
        @NotBlank String isbn,
        String title,
        String description,
        String language,
        Integer publishedYear,
        Double price,
        String status,
        String coverUrl,
        String authorId,
        String authorName,
        String categoryId,
        String categoryName,
        String publisherId,
        String publisherName
) {}
