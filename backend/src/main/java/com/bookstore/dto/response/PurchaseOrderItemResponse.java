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
public class PurchaseOrderItemResponse {

    private Integer id;
    private Integer bookId;
    private String bookTitle;
    private String bookIsbn;
    private Integer quantityOrdered;
    private Integer quantityReceived;
    private Integer quantityRemaining;
    private BigDecimal unitCost;
    private BigDecimal lineTotal;
    private String notes;
}
