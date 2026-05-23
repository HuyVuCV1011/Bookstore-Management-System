package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBookOverview {
    private Integer id;
    private String title;
    private String isbn;
    private BigDecimal price;
    private Integer stockQuantity;
    private boolean isActive;
    private String authorName;
    private String publisherName;
    private String categoryName;
    private boolean mongoSynced;
    private boolean neo4jSynced;
}
