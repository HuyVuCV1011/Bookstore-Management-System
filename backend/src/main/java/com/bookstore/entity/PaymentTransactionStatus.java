package com.bookstore.entity;

public enum PaymentTransactionStatus {
    PENDING,    // Processing
    COMPLETED,  // Success
    FAILED,     // Failed
    REFUNDED    // Refunded
}
