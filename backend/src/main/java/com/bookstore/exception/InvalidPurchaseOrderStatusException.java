package com.bookstore.exception;

import com.bookstore.entity.PurchaseOrderStatus;

public class InvalidPurchaseOrderStatusException extends RuntimeException {
    public InvalidPurchaseOrderStatusException(String operation, PurchaseOrderStatus currentStatus) {
        super(String.format("Cannot %s purchase order with status: %s", operation, currentStatus));
    }

    public InvalidPurchaseOrderStatusException(String message) {
        super(message);
    }
}
