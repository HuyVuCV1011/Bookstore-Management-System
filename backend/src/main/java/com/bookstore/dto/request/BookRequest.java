package com.bookstore.dto.request;

import com.bookstore.entity.BusinessStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookRequest {
    @NotNull(message = "Category ID is required")
    private Integer categoryId;

    @NotNull(message = "Author ID is required")
    private Integer authorId;

    @NotNull(message = "Publisher ID is required")
    private Integer publisherId;

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @Size(max = 13)
    private String isbn;

    private String coverUrl;

    @NotNull(message = "Publication year is required")
    @Min(value = 1000, message = "Publication year must be at least 1000")
    @Max(value = 9999, message = "Publication year must be at most 9999")
    private Integer publicationYear;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", inclusive = false, message = "Price must be greater than zero")
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity must be non-negative")
    private Integer stockQuantity;

    private String description;

    @NotNull(message = "Business status is required")
    private BusinessStatus businessStatus;

    @Size(max = 100)
    private String storageLocation;
}
