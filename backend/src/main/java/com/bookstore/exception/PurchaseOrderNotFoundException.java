package com.bookstore.exception;

public class PurchaseOrderNotFoundException extends ResourceNotFoundException {
    public PurchaseOrderNotFoundException(Integer id) {
        super("Purchase order not found with id: " + id);
    }

    public PurchaseOrderNotFoundException(String poNumber) {
        super("Purchase order not found with PO number: " + poNumber);
    }
}
