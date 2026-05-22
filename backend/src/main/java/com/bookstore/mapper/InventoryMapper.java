package com.bookstore.mapper;

import com.bookstore.dto.response.InventoryTransactionResponse;
import com.bookstore.dto.response.StockLevelResponse;
import com.bookstore.entity.Book;
import com.bookstore.entity.InventoryTransaction;
import com.bookstore.entity.User;
import com.bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InventoryMapper {

    private final UserRepository userRepository;

    public InventoryTransactionResponse toTransactionResponse(InventoryTransaction transaction) {
        String performedByEmail = userRepository.findById(transaction.getPerformedBy())
                .map(User::getEmail)
                .orElse("Unknown");

        return InventoryTransactionResponse.builder()
                .id(transaction.getId())
                .bookId(transaction.getBook().getId())
                .bookTitle(transaction.getBook().getTitle())
                .bookIsbn(transaction.getBook().getIsbn())
                .transactionType(transaction.getTransactionType())
                .quantityChange(transaction.getQuantityChange())
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .oldQuantity(transaction.getOldQuantity())
                .newQuantity(transaction.getNewQuantity())
                .performedBy(transaction.getPerformedBy())
                .performedByEmail(performedByEmail)
                .notes(transaction.getNotes())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    public StockLevelResponse toStockLevelResponse(Book book) {
        return StockLevelResponse.builder()
                .bookId(book.getId())
                .title(book.getTitle())
                .isbn(book.getIsbn())
                .categoryName(book.getCategory().getName())
                .stockQuantity(book.getStockQuantity())
                .storageLocation(book.getStorageLocation())
                .businessStatus(book.getBusinessStatus())
                .build();
    }
}
