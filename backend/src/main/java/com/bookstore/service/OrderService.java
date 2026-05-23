package com.bookstore.service;

import com.bookstore.dto.request.CreateOrderRequest;
import com.bookstore.dto.request.UpdateOrderStatusRequest;
import com.bookstore.dto.response.OrderItemResponse;
import com.bookstore.dto.response.OrderResponse;
import com.bookstore.entity.*;
import com.bookstore.exception.InsufficientStockException;
import com.bookstore.exception.ProfileIncompleteException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.*;
import com.bookstore.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        UUID currentUserId = getCurrentUserId();
        log.debug("Creating order for userId: {}", currentUserId);

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        // Validate customer profile exists and is complete
        Customer customer = customerRepository.findActiveByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found. Please create a customer profile first."));

        if (!customer.isProfileCompleted()) {
            throw new ProfileIncompleteException("Please complete your profile before placing an order");
        }

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotalAmount = BigDecimal.ZERO;

        // Process order items
        for (CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Book book = bookRepository.findByIdForUpdate(itemRequest.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + itemRequest.getBookId()));

            // Check stock availability
            if (book.getStockQuantity() < itemRequest.getQuantity()) {
                throw new InsufficientStockException(
                    String.format("Insufficient stock for '%s'. Available: %d, Requested: %d",
                        book.getTitle(), book.getStockQuantity(), itemRequest.getQuantity())
                );
            }

            // Stock checking under lock (actual mutation is deferred until order is saved to get its UUID)
            BigDecimal lineTotal = book.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            subtotalAmount = subtotalAmount.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .book(book)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(book.getPrice())
                    .lineTotal(lineTotal)
                    // Snapshot fields
                    .isbnSnapshot(book.getIsbn())
                    .titleSnapshot(book.getTitle())
                    .authorSnapshot(book.getAuthor() != null ? book.getAuthor().getName() : null)
                    .categorySnapshot(book.getCategory() != null ? book.getCategory().getName() : null)
                    .coverUrlSnapshot(book.getCoverUrl())
                    .build();

            orderItems.add(orderItem);
        }

        BigDecimal totalAmount = subtotalAmount.add(request.getShippingFee());

        // Generate order code
        String orderCode = generateOrderCode();

        // Determine payment status based on payment method
        // If payment method is BANK_TRANSFER, CREDIT_CARD, or E_WALLET, set to PENDING (awaiting gateway/callback confirmation)
        // If payment method is CASH, set to UNPAID (COD - Cash on Delivery)
        PaymentStatus paymentStatus = (request.getPaymentMethod() == PaymentMethod.CASH)
                ? PaymentStatus.UNPAID
                : PaymentStatus.PENDING;

        // Create order
        CustomerOrder order = CustomerOrder.builder()
                .orderCode(orderCode)
                .user(user)
                .status(OrderStatus.PROCESSING)
                .paymentStatus(paymentStatus)
                .orderedAt(LocalDateTime.now())
                .subtotalAmount(subtotalAmount)
                .shippingFee(request.getShippingFee())
                .totalAmount(totalAmount)
                .paymentMethod(request.getPaymentMethod().name())
                .shippingAddress(request.getShippingAddress())
                .items(orderItems)
                .build();

        // Set bidirectional relationship
        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }

        order = orderRepository.save(order);
        
        // Record sale transactions and update stock atomically through InventoryService
        for (OrderItem item : order.getItems()) {
            inventoryService.recordSaleTransaction(
                    item.getBook().getId(),
                    item.getQuantity(),
                    order.getId(),
                    currentUserId
            );
        }
        
        log.info("Order created - orderId: {}, orderCode: {}, totalAmount: {}",
                order.getId(), order.getOrderCode(), totalAmount);

        return mapToResponse(order, customer);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(OrderStatus status, String keyword, Pageable pageable) {
        User currentUser = getCurrentUser();

        // For CUSTOMER role: filter by their userId
        // For STAFF/ADMIN: show all orders
        UUID userId = (currentUser.getRole() == Role.CUSTOMER) ? currentUser.getId() : null;
        String searchKeyword = (keyword != null) ? keyword : "";

        return orderRepository.searchOrders(userId, status, searchKeyword, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByUUID(UUID orderId) {
        CustomerOrder order = orderRepository.findDetailedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Validate access
        User currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.CUSTOMER &&
            !order.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        Customer customer = customerRepository.findByUserId(order.getUser().getId()).orElse(null);
        return mapToResponse(order, customer);
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, UpdateOrderStatusRequest request) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatusPolicy.validateTransition(order.getStatus(), request.getOrderStatus());

        if (request.getOrderStatus() == OrderStatus.CANCELLED) {
            cancelOrder(orderId);
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        } else {
            order.setStatus(request.getOrderStatus());
            order = orderRepository.save(order);
        }

        Customer customer = customerRepository.findByUserId(order.getUser().getId()).orElse(null);
        return mapToResponse(order, customer);
    }

    @Transactional
    public OrderResponse confirmOrderPayment(UUID orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Order is already paid");
        }

        order.setPaymentStatus(PaymentStatus.PAID);
        order = orderRepository.save(order);
        log.info("Order payment confirmed - orderId: {}, orderCode: {}", order.getId(), order.getOrderCode());

        Customer customer = customerRepository.findByUserId(order.getUser().getId()).orElse(null);
        return mapToResponse(order, customer);
    }

    @Transactional
    public void cancelOrder(UUID orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Validate access
        User currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.CUSTOMER &&
            !order.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            log.info("Order already cancelled, skipping stock restoration - orderId: {}", orderId);
            return;
        }

        OrderStatusPolicy.validateTransition(order.getStatus(), OrderStatus.CANCELLED);

        // Restore stock and record compensating cancellation transaction through InventoryService
        for (OrderItem item : order.getItems()) {
            inventoryService.recordCancelTransaction(
                    item.getBook().getId(),
                    item.getQuantity(),
                    order.getId(),
                    currentUser.getId()
            );
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        log.info("Order cancelled - orderId: {}, orderCode: {}", order.getId(), order.getOrderCode());
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.searchOrders(null, status, "", pageable)
                .map(this::mapToResponse);
    }

    private User getCurrentUser() {
        UUID userId = getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private UUID getCurrentUserId() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userDetails.getUserId();
    }

    private String generateOrderCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", (int) (Math.random() * 10000));
        return "ORD" + timestamp + random;
    }

    private OrderResponse mapToResponse(CustomerOrder order) {
        Customer customer = customerRepository.findByUserId(order.getUser().getId()).orElse(null);
        return mapToResponse(order, customer);
    }

    private OrderResponse mapToResponse(CustomerOrder order, Customer customer) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .customerName(customer != null ? customer.getFullName() : order.getUser().getEmail())
                .customerEmail(order.getUser().getEmail())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .orderedAt(order.getOrderedAt())
                .subtotalAmount(order.getSubtotalAmount())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .itemCount(order.getItems().size())
                .items(itemResponses)
                .build();
    }

    private OrderItemResponse mapToItemResponse(OrderItem item) {
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
