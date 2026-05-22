package com.bookstore.mapper;

import com.bookstore.dto.response.PurchaseOrderDetailResponse;
import com.bookstore.dto.response.PurchaseOrderItemResponse;
import com.bookstore.dto.response.PurchaseOrderResponse;
import com.bookstore.entity.PurchaseOrder;
import com.bookstore.entity.PurchaseOrderItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PurchaseOrderMapper {

    public PurchaseOrderResponse toResponse(PurchaseOrder purchaseOrder) {
        if (purchaseOrder == null) {
            return null;
        }

        return PurchaseOrderResponse.builder()
                .id(purchaseOrder.getId())
                .poNumber(purchaseOrder.getPoNumber())
                .supplierId(purchaseOrder.getSupplier().getId())
                .supplierName(purchaseOrder.getSupplier().getName())
                .status(purchaseOrder.getStatus())
                .orderDate(purchaseOrder.getOrderDate())
                .expectedDeliveryDate(purchaseOrder.getExpectedDeliveryDate())
                .totalAmount(purchaseOrder.getTotalAmount())
                .notes(purchaseOrder.getNotes())
                .createdBy(purchaseOrder.getCreatedBy())
                .receivedBy(purchaseOrder.getReceivedBy())
                .completedAt(purchaseOrder.getCompletedAt())
                .createdAt(purchaseOrder.getCreatedAt())
                .updatedAt(purchaseOrder.getUpdatedAt())
                .build();
    }

    public PurchaseOrderDetailResponse toDetailResponse(PurchaseOrder purchaseOrder) {
        if (purchaseOrder == null) {
            return null;
        }

        List<PurchaseOrderItemResponse> itemResponses = purchaseOrder.getItems().stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return PurchaseOrderDetailResponse.builder()
                .id(purchaseOrder.getId())
                .poNumber(purchaseOrder.getPoNumber())
                .supplierId(purchaseOrder.getSupplier().getId())
                .supplierName(purchaseOrder.getSupplier().getName())
                .status(purchaseOrder.getStatus())
                .orderDate(purchaseOrder.getOrderDate())
                .expectedDeliveryDate(purchaseOrder.getExpectedDeliveryDate())
                .totalAmount(purchaseOrder.getTotalAmount())
                .notes(purchaseOrder.getNotes())
                .createdBy(purchaseOrder.getCreatedBy())
                .receivedBy(purchaseOrder.getReceivedBy())
                .completedAt(purchaseOrder.getCompletedAt())
                .createdAt(purchaseOrder.getCreatedAt())
                .updatedAt(purchaseOrder.getUpdatedAt())
                .items(itemResponses)
                .build();
    }

    public PurchaseOrderItemResponse toItemResponse(PurchaseOrderItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseOrderItemResponse.builder()
                .id(item.getId())
                .bookId(item.getBook().getId())
                .bookTitle(item.getBook().getTitle())
                .bookIsbn(item.getBook().getIsbn())
                .quantityOrdered(item.getQuantityOrdered())
                .quantityReceived(item.getQuantityReceived())
                .quantityRemaining(item.getQuantityRemaining())
                .unitCost(item.getUnitCost())
                .lineTotal(item.getLineTotal())
                .notes(item.getNotes())
                .build();
    }
}
