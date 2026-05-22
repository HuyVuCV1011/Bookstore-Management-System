package com.bookstore.entity;

public enum PaymentStatus {
    UNPAID,    // No payments received
    PARTIAL,   // Partially paid
    PAID,      // Fully paid
    REFUNDED   // Refunded
}
