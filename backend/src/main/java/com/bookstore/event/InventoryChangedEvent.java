package com.bookstore.event;

import lombok.Getter;

@Getter
public class InventoryChangedEvent extends EntityChangedEvent {

    private final Integer bookId;
    private final Integer newQuantity;

    public InventoryChangedEvent(Integer transactionId, Integer bookId, Integer newQuantity) {
        super(transactionId, ChangeType.UPDATE);
        this.bookId = bookId;
        this.newQuantity = newQuantity;
    }
}
