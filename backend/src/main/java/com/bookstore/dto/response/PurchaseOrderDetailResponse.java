package com.bookstore.dto.response;

import com.bookstore.entity.PurchaseOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDetailResponse {

    private Integer id;
    private String poNumber;
    private Integer supplierId;
    private String supplierName;
    private PurchaseOrderStatus status;
    private LocalDateTime orderDate;
    private LocalDate expectedDeliveryDate;
    private BigDecimal totalAmount;
    private String notes;
    private UUID createdBy;
    private UUID receivedBy;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseOrderItemResponse> items;
}
