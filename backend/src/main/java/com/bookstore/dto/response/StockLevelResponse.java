package com.bookstore.dto.response;

import com.bookstore.entity.BusinessStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLevelResponse {

    private Integer bookId;
    private String title;
    private String isbn;
    private String categoryName;
    private Integer stockQuantity;
    private String storageLocation;
    private BusinessStatus businessStatus;
}
