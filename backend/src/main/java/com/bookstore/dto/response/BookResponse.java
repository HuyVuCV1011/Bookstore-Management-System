package com.bookstore.dto.response;

import com.bookstore.entity.BusinessStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Integer id;
    private CategoryResponse category;
    private AuthorResponse author;
    private PublisherResponse publisher;
    private String title;
    private String isbn;
    private String coverUrl;
    private Integer publicationYear;
    private BigDecimal price;
    private Integer stockQuantity;
    private String description;
    private BusinessStatus businessStatus;
    private String storageLocation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
