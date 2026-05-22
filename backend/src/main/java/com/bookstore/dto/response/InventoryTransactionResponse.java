package com.bookstore.dto.response;

import com.bookstore.entity.ReferenceType;
import com.bookstore.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionResponse {

    private Long id;
    private Integer bookId;
    private String bookTitle;
    private String bookIsbn;
    private TransactionType transactionType;
    private Integer quantityChange;
    private ReferenceType referenceType;
    private Integer referenceId;
    private Integer oldQuantity;
    private Integer newQuantity;
    private UUID performedBy;
    private String performedByEmail;
    private String notes;
    private LocalDateTime transactionDate;
}
