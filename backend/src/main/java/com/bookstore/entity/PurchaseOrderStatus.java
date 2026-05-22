package com.bookstore.entity;

public enum PurchaseOrderStatus {
    DRAFT,       // PO is being created/edited
    SUBMITTED,   // PO submitted to supplier, awaiting delivery
    RECEIVING,   // Partial goods received
    COMPLETED,   // All goods fully received
    CANCELLED    // PO cancelled
}
