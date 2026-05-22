package com.bookstore.controller;

import com.bookstore.dto.request.CreatePurchaseOrderRequest;
import com.bookstore.dto.request.ReceiveGoodsRequest;
import com.bookstore.dto.request.UpdatePurchaseOrderRequest;
import com.bookstore.dto.response.PageResponse;
import com.bookstore.dto.response.PurchaseOrderDetailResponse;
import com.bookstore.dto.response.PurchaseOrderResponse;
import com.bookstore.entity.PurchaseOrderStatus;
import com.bookstore.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PurchaseOrderResponse> create(
            @Valid @RequestBody CreatePurchaseOrderRequest request) {
        log.info("Creating purchase order for supplier ID: {}", request.getSupplierId());
        PurchaseOrderResponse response = purchaseOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PageResponse<PurchaseOrderResponse>> getAll(
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size,
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) Integer supplierId,
            @RequestParam(required = false) String keyword) {

        log.info("Fetching purchase orders - page: {}, size: {}, status: {}, supplierId: {}, keyword: {}",
                 page, size, status, supplierId, keyword);

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<PurchaseOrderResponse> result = purchaseOrderService.getAll(
            pageable, status, supplierId, keyword
        );

        return ResponseEntity.ok(PageResponse.of(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PurchaseOrderDetailResponse> getById(@PathVariable Integer id) {
        log.info("Fetching purchase order with ID: {}", id);
        PurchaseOrderDetailResponse response = purchaseOrderService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PurchaseOrderResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdatePurchaseOrderRequest request) {
        log.info("Updating purchase order ID: {}", id);
        PurchaseOrderResponse response = purchaseOrderService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        log.info("Deleting purchase order ID: {}", id);
        purchaseOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PurchaseOrderResponse> submit(@PathVariable Integer id) {
        log.info("Submitting purchase order ID: {}", id);
        PurchaseOrderResponse response = purchaseOrderService.submit(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PurchaseOrderResponse> receiveGoods(
            @PathVariable Integer id,
            @Valid @RequestBody ReceiveGoodsRequest request) {
        log.info("Receiving goods for purchase order ID: {}", id);
        PurchaseOrderResponse response = purchaseOrderService.receiveGoods(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PurchaseOrderResponse> cancel(@PathVariable Integer id) {
        log.info("Cancelling purchase order ID: {}", id);
        PurchaseOrderResponse response = purchaseOrderService.cancel(id);
        return ResponseEntity.ok(response);
    }
}
