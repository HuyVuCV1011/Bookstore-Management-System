package com.bookstore.controller;

import com.bookstore.dto.request.StockAdjustmentRequest;
import com.bookstore.dto.response.InventoryTransactionResponse;
import com.bookstore.dto.response.PageResponse;
import com.bookstore.dto.response.StockLevelResponse;
import com.bookstore.entity.TransactionType;
import com.bookstore.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    public ResponseEntity<PageResponse<StockLevelResponse>> getAllStock(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<StockLevelResponse> result;

        if (keyword != null && !keyword.trim().isEmpty()) {
            result = inventoryService.searchStock(keyword, pageable);
        } else {
            result = inventoryService.getAllStock(pageable);
        }

        return ResponseEntity.ok(PageResponse.of(result));
    }

    @GetMapping("/stock/{bookId}")
    public ResponseEntity<StockLevelResponse> getStockByBookId(@PathVariable Integer bookId) {
        StockLevelResponse response = inventoryService.getStockByBookId(bookId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryTransactionResponse> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request
    ) {
        InventoryTransactionResponse response = inventoryService.adjustStock(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions")
    public ResponseEntity<PageResponse<InventoryTransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) TransactionType type
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<InventoryTransactionResponse> result;

        if (startDate != null && endDate != null) {
            result = inventoryService.getTransactionsByDateRange(startDate, endDate, pageable);
        } else if (type != null) {
            result = inventoryService.getTransactionsByType(type, pageable);
        } else {
            result = inventoryService.getTransactionHistory(pageable);
        }

        return ResponseEntity.ok(PageResponse.of(result));
    }

    @GetMapping("/transactions/book/{bookId}")
    public ResponseEntity<PageResponse<InventoryTransactionResponse>> getTransactionsByBook(
            @PathVariable Integer bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<InventoryTransactionResponse> result = inventoryService.getTransactionsByBook(bookId, pageable);
        return ResponseEntity.ok(PageResponse.of(result));
    }
}
