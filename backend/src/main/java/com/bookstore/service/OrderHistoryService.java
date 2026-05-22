package com.bookstore.service;

import com.bookstore.dto.response.OrderItemResponse;
import com.bookstore.dto.response.OrderResponse;
import com.bookstore.dto.response.OrderStatsResponse;
import com.bookstore.entity.CustomerOrder;
import com.bookstore.entity.OrderItem;
import com.bookstore.entity.OrderStatus;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.graph.dto.request.SyncOrderRequest;
import com.bookstore.graph.service.GraphInteractionService;
import com.bookstore.repository.OrderRepository;
import com.bookstore.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class OrderHistoryService {

    private final OrderRepository orderRepository;
    private final GraphInteractionService graphInteractionService;

    @Order(Ordered.LOWEST_PRECEDENCE)
    @EventListener(ApplicationReadyEvent.class)
    public void syncCompletedOrdersToGraphOnStartup() {
        int synced = syncCompletedOrdersToGraph();
        log.info("Synced {} completed Postgres orders to Neo4j graph projection on startup", synced);
    }

    public Page<OrderResponse> getOrders(
            CustomUserDetails userDetails,
            Pageable pageable,
            String keyword,
            OrderStatus status
    ) {
        UUID userId = canViewAllOrders(userDetails) ? null : userDetails.getUserId();
        return orderRepository.searchOrders(userId, status, normalize(keyword), pageable)
                .map(this::toResponse);
    }

    public OrderResponse getOrder(CustomUserDetails userDetails, UUID id) {
        CustomerOrder order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        if (!canViewAllOrders(userDetails) && !order.getUser().getId().equals(userDetails.getUserId())) {
            throw new AccessDeniedException("You can only view your own orders");
        }
        return toResponse(order);
    }

    public OrderStatsResponse getStats(CustomUserDetails userDetails) {
        UUID userId = canViewAllOrders(userDetails) ? null : userDetails.getUserId();
        List<CustomerOrder> orders = orderRepository.findForStats(userId);

        long totalItems = orders.stream()
                .flatMap(order -> order.getItems().stream())
                .mapToLong(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                .sum();

        BigDecimal revenue = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.COMPLETED)
                .map(CustomerOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderStatsResponse.builder()
                .totalOrders(orders.size())
                .completedOrders(countStatus(orders, OrderStatus.COMPLETED))
                .processingOrders(countStatus(orders, OrderStatus.PROCESSING))
                .cancelledOrders(countStatus(orders, OrderStatus.CANCELLED))
                .totalItems(totalItems)
                .totalRevenue(revenue)
                .build();
    }

    public int syncCompletedOrdersToGraph() {
        List<CustomerOrder> orders = orderRepository.findGraphSyncableOrders(List.of(OrderStatus.COMPLETED));
        int synced = 0;

        for (CustomerOrder order : orders) {
            try {
                graphInteractionService.syncCustomer(
                        order.getUser().getId().toString(),
                        order.getUser().getEmail(),
                        order.getUser().getEmail()
                );

                List<SyncOrderRequest.OrderItemRequest> items = order.getItems().stream()
                        .filter(item -> item.getIsbnSnapshot() != null && !item.getIsbnSnapshot().isBlank())
                        .map(item -> new SyncOrderRequest.OrderItemRequest(
                                item.getIsbnSnapshot(),
                                item.getQuantity(),
                                item.getUnitPrice().doubleValue()
                        ))
                        .toList();

                if (!items.isEmpty()) {
                    graphInteractionService.syncOrder(new SyncOrderRequest(
                            order.getUser().getId().toString(),
                            order.getOrderCode(),
                            order.getOrderedAt(),
                            items
                    ));
                    synced++;
                }
            } catch (Exception ex) {
                log.warn("Failed to sync order {} to Neo4j", order.getOrderCode(), ex);
            }
        }

        return synced;
    }

    private boolean canViewAllOrders(CustomUserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .anyMatch(authority ->
                        "ROLE_ADMIN".equals(authority.getAuthority()) ||
                        "ROLE_STAFF".equals(authority.getAuthority())
                );
    }

    private String normalize(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }

    private long countStatus(List<CustomerOrder> orders, OrderStatus status) {
        return orders.stream().filter(order -> order.getStatus() == status).count();
    }

    private OrderResponse toResponse(CustomerOrder order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .sorted(Comparator.comparing(item -> item.getTitleSnapshot() == null ? "" : item.getTitleSnapshot()))
                .map(this::toItemResponse)
                .toList();

        int itemCount = items.stream()
                .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                .sum();

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .customerName(order.getUser().getEmail())
                .customerEmail(order.getUser().getEmail())
                .status(order.getStatus())
                .orderedAt(order.getOrderedAt())
                .subtotalAmount(order.getSubtotalAmount())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .itemCount(itemCount)
                .items(items)
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .bookId(item.getBook().getId())
                .isbn(item.getIsbnSnapshot())
                .title(item.getTitleSnapshot())
                .authorName(item.getAuthorSnapshot())
                .categoryName(item.getCategorySnapshot())
                .coverUrl(item.getCoverUrlSnapshot())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
