package com.bookstore.dto.response;

import com.bookstore.entity.BusinessStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {
    private Integer bookId;
    private String title;
    private String isbn;
    private Integer stockQuantity;
    private BusinessStatus businessStatus;
    private BigDecimal price;
    private String categoryName;
    private String authorName;
}
