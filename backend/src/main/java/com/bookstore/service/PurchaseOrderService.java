package com.bookstore.service;

import com.bookstore.dto.request.CreatePurchaseOrderRequest;
import com.bookstore.dto.request.PurchaseOrderItemRequest;
import com.bookstore.dto.request.ReceiveGoodsRequest;
import com.bookstore.dto.request.ReceiveItemRequest;
import com.bookstore.dto.request.UpdatePurchaseOrderRequest;
import com.bookstore.dto.response.PurchaseOrderDetailResponse;
import com.bookstore.dto.response.PurchaseOrderResponse;
import com.bookstore.entity.*;
import com.bookstore.exception.*;
import com.bookstore.mapper.PurchaseOrderMapper;
import com.bookstore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final BookRepository bookRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;

    private UUID getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof com.bookstore.security.CustomUserDetails) {
            com.bookstore.security.CustomUserDetails userDetails =
                (com.bookstore.security.CustomUserDetails) authentication.getPrincipal();
            return userDetails.getUserId();
        }
        throw new RuntimeException("User not authenticated");
    }

    private String generatePoNumber() {
        int year = Year.now().getValue();
        String prefix = "PO-" + year + "-";

        long count = purchaseOrderRepository.count() + 1;
        return prefix + String.format("%04d", count);
    }

    @Transactional
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        log.info("Creating purchase order for supplier ID: {}", request.getSupplierId());

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        UUID currentUserId = getCurrentUserId();
        String poNumber = generatePoNumber();

        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .poNumber(poNumber)
                .supplier(supplier)
                .status(PurchaseOrderStatus.DRAFT)
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .notes(request.getNotes())
                .totalAmount(BigDecimal.ZERO)
                .build();

        purchaseOrder.setCreatedBy(currentUserId);
        purchaseOrder.setUpdatedBy(currentUserId);

        for (PurchaseOrderItemRequest itemRequest : request.getItems()) {
            Book book = bookRepository.findById(itemRequest.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + itemRequest.getBookId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .book(book)
                    .quantityOrdered(itemRequest.getQuantity())
                    .quantityReceived(0)
                    .unitCost(itemRequest.getUnitCost())
                    .notes(itemRequest.getNotes())
                    .build();

            item.calculateLineTotal();
            purchaseOrder.addItem(item);
        }

        purchaseOrder.calculateTotalAmount();
        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);

        log.info("Purchase order created with PO number: {}", poNumber);
        return purchaseOrderMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDetailResponse getById(Integer id) {
        log.info("Fetching purchase order with ID: {}", id);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(id));

        return purchaseOrderMapper.toDetailResponse(purchaseOrder);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> getAll(
            Pageable pageable,
            PurchaseOrderStatus status,
            Integer supplierId,
            String keyword) {

        log.info("Fetching purchase orders - status: {}, supplierId: {}, keyword: {}",
                 status, supplierId, keyword);

        Page<PurchaseOrder> purchaseOrders;

        if (keyword != null && !keyword.isBlank()) {
            purchaseOrders = purchaseOrderRepository.findByKeyword(keyword, pageable);
        } else if (status != null) {
            purchaseOrders = purchaseOrderRepository.findByStatus(status, pageable);
        } else if (supplierId != null) {
            purchaseOrders = purchaseOrderRepository.findBySupplierId(supplierId, pageable);
        } else {
            purchaseOrders = purchaseOrderRepository.findAll(pageable);
        }

        return purchaseOrders.map(purchaseOrderMapper::toResponse);
    }

    @Transactional
    public PurchaseOrderResponse update(Integer id, UpdatePurchaseOrderRequest request) {
        log.info("Updating purchase order ID: {}", id);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(id));

        if (purchaseOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new InvalidPurchaseOrderStatusException("update", purchaseOrder.getStatus());
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        purchaseOrder.setSupplier(supplier);
        purchaseOrder.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        purchaseOrder.setNotes(request.getNotes());
        purchaseOrder.setUpdatedBy(getCurrentUserId());

        purchaseOrder.getItems().clear();

        for (PurchaseOrderItemRequest itemRequest : request.getItems()) {
            Book book = bookRepository.findById(itemRequest.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + itemRequest.getBookId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .book(book)
                    .quantityOrdered(itemRequest.getQuantity())
                    .quantityReceived(0)
                    .unitCost(itemRequest.getUnitCost())
                    .notes(itemRequest.getNotes())
                    .build();

            item.calculateLineTotal();
            purchaseOrder.addItem(item);
        }

        purchaseOrder.calculateTotalAmount();
        PurchaseOrder updated = purchaseOrderRepository.save(purchaseOrder);

        log.info("Purchase order updated: {}", id);
        return purchaseOrderMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Integer id) {
        log.info("Deleting purchase order ID: {}", id);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(id));

        if (purchaseOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new InvalidPurchaseOrderStatusException("delete", purchaseOrder.getStatus());
        }

        purchaseOrder.setDeletedAt(LocalDateTime.now());
        purchaseOrder.setUpdatedBy(getCurrentUserId());
        purchaseOrderRepository.save(purchaseOrder);

        log.info("Purchase order soft deleted: {}", id);
    }

    @Transactional
    public PurchaseOrderResponse submit(Integer id) {
        log.info("Submitting purchase order ID: {}", id);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(id));

        if (purchaseOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new InvalidPurchaseOrderStatusException("submit", purchaseOrder.getStatus());
        }

        purchaseOrder.setStatus(PurchaseOrderStatus.SUBMITTED);
        purchaseOrder.setOrderDate(LocalDateTime.now());
        purchaseOrder.setUpdatedBy(getCurrentUserId());

        PurchaseOrder updated = purchaseOrderRepository.save(purchaseOrder);

        log.info("Purchase order submitted: {}", purchaseOrder.getPoNumber());
        return purchaseOrderMapper.toResponse(updated);
    }

    @Transactional
    public PurchaseOrderResponse receiveGoods(Integer id, ReceiveGoodsRequest request) {
        log.info("Receiving goods for purchase order ID: {}", id);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(id));

        if (purchaseOrder.getStatus() != PurchaseOrderStatus.SUBMITTED &&
            purchaseOrder.getStatus() != PurchaseOrderStatus.RECEIVING) {
            throw new InvalidPurchaseOrderStatusException(
                "Cannot receive goods for purchase order with status: " + purchaseOrder.getStatus()
            );
        }

        UUID currentUserId = getCurrentUserId();
        boolean isFirstReceive = purchaseOrder.getReceivedBy() == null;

        for (ReceiveItemRequest itemRequest : request.getItems()) {
            PurchaseOrderItem item = purchaseOrder.getItems().stream()
                    .filter(i -> i.getId().equals(itemRequest.getItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order item not found with id: " + itemRequest.getItemId()
                    ));

            int newQuantityReceived = item.getQuantityReceived() + itemRequest.getQuantityReceived();

            if (newQuantityReceived > item.getQuantityOrdered()) {
                throw new IllegalArgumentException(
                    String.format("Received quantity (%d) exceeds ordered quantity (%d) for item %d",
                        newQuantityReceived, item.getQuantityOrdered(), item.getId())
                );
            }

            item.setQuantityReceived(newQuantityReceived);

            createInventoryTransaction(
                item.getBook(),
                itemRequest.getQuantityReceived(),
                purchaseOrder.getId(),
                String.format("Received goods for PO %s", purchaseOrder.getPoNumber())
            );

            log.info("Received {} units for book ID {} (PO item {})",
                     itemRequest.getQuantityReceived(), item.getBook().getId(), item.getId());
        }

        if (isFirstReceive) {
            purchaseOrder.setReceivedBy(currentUserId);
            purchaseOrder.setStatus(PurchaseOrderStatus.RECEIVING);
            log.info("First goods receipt - PO status changed to RECEIVING");
        }

        if (isPurchaseOrderFullyReceived(purchaseOrder)) {
            purchaseOrder.setStatus(PurchaseOrderStatus.COMPLETED);
            purchaseOrder.setCompletedAt(LocalDateTime.now());
            log.info("All goods received - PO status changed to COMPLETED");
        }

        purchaseOrder.setUpdatedBy(currentUserId);
        PurchaseOrder updated = purchaseOrderRepository.save(purchaseOrder);

        log.info("Goods receipt processed for PO: {}", purchaseOrder.getPoNumber());
        return purchaseOrderMapper.toResponse(updated);
    }

    @Transactional
    public PurchaseOrderResponse cancel(Integer id) {
        log.info("Cancelling purchase order ID: {}", id);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(id));

        if (purchaseOrder.getStatus() == PurchaseOrderStatus.COMPLETED) {
            throw new InvalidPurchaseOrderStatusException(
                "Cannot cancel a completed purchase order"
            );
        }

        if (purchaseOrder.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new InvalidPurchaseOrderStatusException(
                "Purchase order is already cancelled"
            );
        }

        purchaseOrder.setStatus(PurchaseOrderStatus.CANCELLED);
        purchaseOrder.setUpdatedBy(getCurrentUserId());

        PurchaseOrder updated = purchaseOrderRepository.save(purchaseOrder);

        log.info("Purchase order cancelled: {}", purchaseOrder.getPoNumber());
        return purchaseOrderMapper.toResponse(updated);
    }

    private boolean isPurchaseOrderFullyReceived(PurchaseOrder purchaseOrder) {
        return purchaseOrder.getItems().stream()
                .allMatch(item -> item.getQuantityReceived().equals(item.getQuantityOrdered()));
    }

    private void createInventoryTransaction(
            Book book,
            Integer quantity,
            Integer purchaseOrderId,
            String notes) {

        Integer oldQuantity = book.getStockQuantity();
        Integer newQuantity = oldQuantity + quantity;

        InventoryTransaction transaction = InventoryTransaction.builder()
                .book(book)
                .transactionType(TransactionType.PURCHASE_IN)
                .quantityChange(quantity)
                .referenceType(ReferenceType.PURCHASE_ORDER)
                .referenceId(purchaseOrderId)
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .performedBy(getCurrentUserId())
                .notes(notes)
                .transactionDate(LocalDateTime.now())
                .build();

        inventoryTransactionRepository.save(transaction);

        book.setStockQuantity(newQuantity);
        bookRepository.save(book);
    }
}
