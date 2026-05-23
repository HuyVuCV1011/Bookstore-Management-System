package com.bookstore.service;

import com.bookstore.entity.Role;
import com.bookstore.entity.User;
import com.bookstore.event.CustomerGraphProjectionAction;
import com.bookstore.event.CustomerGraphProjectionEvent;
import com.bookstore.graph.service.GraphInteractionService;
import com.bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Log4j2
public class CustomerGraphProjectionService {

    private final UserRepository userRepository;
    private final GraphInteractionService graphInteractionService;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void handleCustomerProjectionEvent(CustomerGraphProjectionEvent event) {
        try {
            if (shouldDeactivate(event)) {
                graphInteractionService.deactivateCustomer(event.userId().toString());
                return;
            }

            graphInteractionService.syncCustomer(
                    event.userId().toString(),
                    event.fullName(),
                    event.email()
            );
        } catch (Exception ex) {
            log.warn("Postgres customer data remains valid, but Neo4j customer projection sync failed for event {}", event, ex);
        }
    }

    @Order(Ordered.HIGHEST_PRECEDENCE + 1)
    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void syncActiveCustomersOnStartup() {
        userRepository.findActiveByRole(Role.CUSTOMER)
                .forEach(this::syncCustomer);
    }

    private boolean shouldDeactivate(CustomerGraphProjectionEvent event) {
        return event.action() == CustomerGraphProjectionAction.DEACTIVATE
                || event.role() != Role.CUSTOMER
                || !Boolean.TRUE.equals(event.active());
    }

    private void syncCustomer(User user) {
        try {
            graphInteractionService.syncCustomer(
                    user.getId().toString(),
                    user.getEmail(),
                    user.getEmail()
            );
        } catch (Exception ex) {
            log.warn("Failed to sync customer {} from Postgres to Neo4j projection", user.getId(), ex);
        }
    }
}
