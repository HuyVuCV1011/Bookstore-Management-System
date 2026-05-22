package com.bookstore.listener;

import com.bookstore.entity.InventoryTransaction;
import com.bookstore.event.InventoryChangedEvent;
import jakarta.persistence.PostPersist;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class InventoryTransactionListener {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostPersist
    public void onPostPersist(InventoryTransaction transaction) {
        log.debug("[CDC] Inventory transaction created: id={}, bookId={}, newQuantity={}",
                  transaction.getId(),
                  transaction.getBook().getId(),
                  transaction.getNewQuantity());

        InventoryChangedEvent event = new InventoryChangedEvent(
                transaction.getId().intValue(),
                transaction.getBook().getId(),
                transaction.getNewQuantity()
        );

        eventPublisher.publishEvent(event);
    }
}
