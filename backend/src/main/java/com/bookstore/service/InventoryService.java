package com.bookstore.service;

import com.bookstore.dto.request.StockAdjustmentRequest;
import com.bookstore.dto.response.InventoryTransactionResponse;
import com.bookstore.dto.response.StockLevelResponse;
import com.bookstore.entity.*;
import com.bookstore.exception.BusinessRuleException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.InventoryMapper;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.InventoryTransactionRepository;
import com.bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryService {

    private final BookRepository bookRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final InventoryMapper inventoryMapper;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<StockLevelResponse> getAllStock(Pageable pageable) {
        return bookRepository.findAll(pageable)
                .map(inventoryMapper::toStockLevelResponse);
    }

    @Transactional(readOnly = true)
    public Page<StockLevelResponse> searchStock(String keyword, Pageable pageable) {
        return bookRepository.findAll(pageable) // Implement search in BookRepository if needed
                .map(inventoryMapper::toStockLevelResponse);
    }

    @Transactional(readOnly = true)
    public StockLevelResponse getStockByBookId(Integer bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
        return inventoryMapper.toStockLevelResponse(book);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getTransactionHistory(Pageable pageable) {
        return transactionRepository.findAll(pageable)
                .map(inventoryMapper::toTransactionResponse);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getTransactionsByBook(Integer bookId, Pageable pageable) {
        return transactionRepository.findByBookId(bookId, pageable)
                .map(inventoryMapper::toTransactionResponse);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getTransactionsByDateRange(
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        return transactionRepository.findByDateRange(startDate, endDate, pageable)
                .map(inventoryMapper::toTransactionResponse);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getTransactionsByType(
            TransactionType type,
            Pageable pageable
    ) {
        return transactionRepository.findByTransactionType(type, pageable)
                .map(inventoryMapper::toTransactionResponse);
    }

    public InventoryTransactionResponse adjustStock(StockAdjustmentRequest request) {
        Book book = bookRepository.findByIdForUpdate(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + request.getBookId()));

        int oldQuantity = book.getStockQuantity();
        int newQuantity = oldQuantity + request.getQuantityChange();

        if (newQuantity < 0) {
            throw new BusinessRuleException("Stock quantity cannot be negative. Current: " + oldQuantity + ", Change: " + request.getQuantityChange());
        }

        book.setStockQuantity(newQuantity);
        bookRepository.save(book);

        UUID currentUserId = getCurrentUserId();

        InventoryTransaction transaction = InventoryTransaction.builder()
                .book(book)
                .transactionType(TransactionType.ADJUSTMENT)
                .quantityChange(request.getQuantityChange())
                .referenceType(ReferenceType.MANUAL)
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .performedBy(currentUserId)
                .notes(request.getReason())
                .build();

        InventoryTransaction saved = transactionRepository.save(transaction);
        return inventoryMapper.toTransactionResponse(saved);
    }

    public void recordPurchaseTransaction(Integer bookId, Integer quantity, Integer purchaseOrderId, UUID performedBy, String notes) {
        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        int oldQuantity = book.getStockQuantity();
        int newQuantity = oldQuantity + quantity;

        book.setStockQuantity(newQuantity);
        bookRepository.save(book);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .book(book)
                .transactionType(TransactionType.PURCHASE_IN)
                .quantityChange(quantity)
                .referenceType(ReferenceType.PURCHASE_ORDER)
                .referenceId(String.valueOf(purchaseOrderId))
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .performedBy(performedBy)
                .notes(notes)
                .build();

        transactionRepository.save(transaction);
    }

    public void recordSaleTransaction(Integer bookId, Integer quantity, UUID orderId, UUID performedBy) {
        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        int oldQuantity = book.getStockQuantity();
        int newQuantity = oldQuantity - quantity;

        if (newQuantity < 0) {
            throw new BusinessRuleException("Insufficient stock. Available: " + oldQuantity + ", Required: " + quantity);
        }

        book.setStockQuantity(newQuantity);
        bookRepository.save(book);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .book(book)
                .transactionType(TransactionType.SALE_OUT)
                .quantityChange(-quantity)
                .referenceType(ReferenceType.ORDER)
                .referenceId(orderId.toString())
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .performedBy(performedBy)
                .notes("Order #" + orderId)
                .build();

        transactionRepository.save(transaction);
    }

    public void recordCancelTransaction(Integer bookId, Integer quantity, UUID orderId, UUID performedBy) {
        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        int oldQuantity = book.getStockQuantity();
        int newQuantity = oldQuantity + quantity;

        book.setStockQuantity(newQuantity);
        bookRepository.save(book);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .book(book)
                .transactionType(TransactionType.SALE_OUT)
                .quantityChange(quantity)
                .referenceType(ReferenceType.ORDER)
                .referenceId(orderId.toString())
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .performedBy(performedBy)
                .notes("Cancelled Order #" + orderId)
                .build();

        transactionRepository.save(transaction);
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("User not found: " + email))
                    .getId();
        }

        throw new IllegalStateException("Invalid authentication principal");
    }

    @Transactional(readOnly = true)
    public java.util.List<StockLevelResponse> getLowStockBooks(int threshold, int limit) {
        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(0, limit);
        return bookRepository.findLowStockBooks(threshold, pageRequest).stream()
                .map(inventoryMapper::toStockLevelResponse)
                .collect(java.util.stream.Collectors.toList());
    }
}
