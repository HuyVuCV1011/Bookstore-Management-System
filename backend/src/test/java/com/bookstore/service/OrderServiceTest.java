package com.bookstore.service;

import com.bookstore.config.AuditConfig;
import com.bookstore.dto.request.CreateOrderRequest;
import com.bookstore.dto.request.UpdateOrderStatusRequest;
import com.bookstore.entity.*;
import com.bookstore.exception.InsufficientStockException;
import com.bookstore.exception.InvalidOrderStatusTransitionException;
import com.bookstore.repository.*;
import com.bookstore.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
@Import(AuditConfig.class)
class OrderServiceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("bookstore")
            .withUsername("bookstore_user")
            .withPassword("password");

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    private OrderService orderService;
    private User testUser;
    private Customer testCustomer;
    private Book testBook;
    private Category testCategory;
    private Author testAuthor;
    private Publisher testPublisher;

    @BeforeEach
    void setUp() {
        var inventoryMapper = new com.bookstore.mapper.InventoryMapper(userRepository);
        var inventoryService = new InventoryService(bookRepository, inventoryTransactionRepository, inventoryMapper, userRepository);
        orderService = new OrderService(orderRepository, customerRepository, bookRepository, userRepository, inventoryService);

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime now = LocalDateTime.now();

        // 1. Create User
        testUser = User.builder()
                .email("user-" + uniqueSuffix + "@bookstore.com")
                .password("password")
                .role(Role.CUSTOMER)
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        entityManager.persist(testUser);

        // 2. Create Customer Profile
        testCustomer = Customer.builder()
                .user(testUser)
                .fullName("John Doe " + uniqueSuffix)
                .phoneNumber("0987654321")
                .email(testUser.getEmail())
                .profileCompleted(true)
                .build();
        entityManager.persist(testCustomer);

        // 3. Create dependencies for Book
        testCategory = Category.builder().name("Category " + uniqueSuffix).build();
        entityManager.persist(testCategory);

        testAuthor = Author.builder().name("Author " + uniqueSuffix).build();
        entityManager.persist(testAuthor);

        testPublisher = Publisher.builder().name("Publisher " + uniqueSuffix).build();
        entityManager.persist(testPublisher);

        // 4. Create Book
        testBook = Book.builder()
                .title("Book Title " + uniqueSuffix)
                .isbn("ISBN-" + uniqueSuffix)
                .price(BigDecimal.valueOf(150.00))
                .stockQuantity(10)
                .publicationYear(2026)
                .businessStatus(BusinessStatus.ACTIVE)
                .category(testCategory)
                .author(testAuthor)
                .publisher(testPublisher)
                .build();
        entityManager.persist(testBook);

        entityManager.flush();
        entityManager.clear();

        // 5. Mock Security Principal using actual CustomUserDetails constructor signature
        CustomUserDetails userDetails = new CustomUserDetails(
                testUser.getId(),
                testUser.getEmail(),
                testUser.getPassword(),
                true,
                AuthorityUtils.createAuthorityList("ROLE_" + testUser.getRole().name())
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testCreateOrder_Success_ReducesStock() {
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(3)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var response = orderService.createOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getOrderCode()).startsWith("ORD");
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PROCESSING);
        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.UNPAID); // Cash -> UNPAID

        // Verify stock is reduced
        Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(updatedBook.getStockQuantity()).isEqualTo(7);
    }

    @Test
    void testCreateOrder_InsufficientStock_ThrowsException() {
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(11) // testBook has 10
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        assertThrows(InsufficientStockException.class, () -> orderService.createOrder(request));

        // Verify stock is unchanged
        Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(updatedBook.getStockQuantity()).isEqualTo(10);
    }

    @Test
    void testCancelOrder_Success_RestoresStock() {
        // First place order
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(4)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Verify intermediate stock
        Book midBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(midBook.getStockQuantity()).isEqualTo(6);

        // Cancel order
        orderService.cancelOrder(orderId);

        // Verify final stock
        Book finalBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(finalBook.getStockQuantity()).isEqualTo(10);

        // Check order status is cancelled
        CustomerOrder order = orderRepository.findById(orderId).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    void testCancelOrder_Idempotent_DoesNotRestoreStockTwice() {
        // First place order
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(4)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Verify stock is reduced
        Book midBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(midBook.getStockQuantity()).isEqualTo(6);

        // Cancel order first time
        orderService.cancelOrder(orderId);

        // Verify stock is restored
        Book restoredBook1 = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(restoredBook1.getStockQuantity()).isEqualTo(10);

        // Record number of transactions in DB
        long initialTxCount = inventoryTransactionRepository.count();

        // Cancel order second time (idempotency check)
        orderService.cancelOrder(orderId);

        // Verify stock did NOT increase again (should still be 10, not 14)
        Book restoredBook2 = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(restoredBook2.getStockQuantity()).isEqualTo(10);

        // Verify no additional transactions were recorded
        long finalTxCount = inventoryTransactionRepository.count();
        assertThat(finalTxCount).isEqualTo(initialTxCount);
    }

    @Test
    void testCancelOrder_Shipped_ThrowsException() {
        // Place order
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(4)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Update status to SHIPPED
        CustomerOrder order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        // Try to cancel and assert exception
        assertThrows(InvalidOrderStatusTransitionException.class, () -> orderService.cancelOrder(orderId));

        // Verify stock remains reduced
        Book finalBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(finalBook.getStockQuantity()).isEqualTo(6);
    }

    @Test
    void testGetOrderByUUID_AnotherCustomer_ThrowsException() {
        // Place order for Customer A (testUser / testCustomer)
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(2)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Now mock login as Customer B
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime now = LocalDateTime.now();
        User anotherUser = User.builder()
                .email("user-" + uniqueSuffix + "@bookstore.com")
                .password("password")
                .role(Role.CUSTOMER)
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        entityManager.persist(anotherUser);
        entityManager.flush();

        CustomUserDetails userDetails = new CustomUserDetails(
                anotherUser.getId(),
                anotherUser.getEmail(),
                anotherUser.getPassword(),
                true,
                AuthorityUtils.createAuthorityList("ROLE_" + anotherUser.getRole().name())
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Try to fetch Customer A's order with Customer B's login - should throw ResourceNotFoundException
        assertThrows(com.bookstore.exception.ResourceNotFoundException.class, () -> orderService.getOrderByUUID(orderId));
    }

    @Test
    void testCancelOrder_AnotherCustomer_ThrowsException() {
        // Place order for Customer A
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(2)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Mock login as Customer B
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime now = LocalDateTime.now();
        User anotherUser = User.builder()
                .email("user-" + uniqueSuffix + "@bookstore.com")
                .password("password")
                .role(Role.CUSTOMER)
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        entityManager.persist(anotherUser);
        entityManager.flush();

        CustomUserDetails userDetails = new CustomUserDetails(
                anotherUser.getId(),
                anotherUser.getEmail(),
                anotherUser.getPassword(),
                true,
                AuthorityUtils.createAuthorityList("ROLE_" + anotherUser.getRole().name())
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Try to cancel Customer A's order with Customer B's login - should throw ResourceNotFoundException
        assertThrows(com.bookstore.exception.ResourceNotFoundException.class, () -> orderService.cancelOrder(orderId));
    }

    @Test
    void testUpdateOrderStatus_ValidTransitions() {
        // Place order
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(1)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Default initial status is PROCESSING (as per current code).
        // 1. Transition: PROCESSING -> SHIPPED
        var updateRequest = UpdateOrderStatusRequest.builder().orderStatus(OrderStatus.SHIPPED).build();
        var updated = orderService.updateOrderStatus(orderId, updateRequest);
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.SHIPPED);

        // 2. Transition: SHIPPED -> COMPLETED
        updateRequest = UpdateOrderStatusRequest.builder().orderStatus(OrderStatus.COMPLETED).build();
        updated = orderService.updateOrderStatus(orderId, updateRequest);
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void testUpdateOrderStatus_InvalidTransitions() {
        // Place order
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(1)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.CASH)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var orderResponse = orderService.createOrder(request);
        UUID orderId = orderResponse.getId();

        // Initial status is PROCESSING.
        // Try to transition: PROCESSING -> COMPLETED directly (invalid: must go through SHIPPED)
        final var completedRequest = UpdateOrderStatusRequest.builder().orderStatus(OrderStatus.COMPLETED).build();
        assertThrows(InvalidOrderStatusTransitionException.class, () -> orderService.updateOrderStatus(orderId, completedRequest));

        // Let's transition to CANCELLED (valid from PROCESSING)
        final var cancelledRequest = UpdateOrderStatusRequest.builder().orderStatus(OrderStatus.CANCELLED).build();
        orderService.updateOrderStatus(orderId, cancelledRequest);

        // Try to transition CANCELLED -> PROCESSING (invalid: cancelled is terminal)
        final var processingRequest = UpdateOrderStatusRequest.builder().orderStatus(OrderStatus.PROCESSING).build();
        assertThrows(InvalidOrderStatusTransitionException.class, () -> orderService.updateOrderStatus(orderId, processingRequest));
    }

    @Test
    void testCreateOrder_ElectronicPayment_StartsPending() {
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(1)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.BANK_TRANSFER) // Electronic payment
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var response = orderService.createOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void testConfirmOrderPayment_Success() {
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(1)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var response = orderService.createOrder(request);
        UUID orderId = response.getId();

        var confirmedResponse = orderService.confirmOrderPayment(orderId);
        assertThat(confirmedResponse.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void testConfirmOrderPayment_AlreadyPaid_ThrowsException() {
        CreateOrderRequest.OrderItemRequest itemRequest = CreateOrderRequest.OrderItemRequest.builder()
                .bookId(testBook.getId())
                .quantity(1)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .shippingAddress("123 Test St")
                .phoneNumber("0987654321")
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .shippingFee(BigDecimal.valueOf(10.00))
                .build();

        var response = orderService.createOrder(request);
        UUID orderId = response.getId();

        // First confirmation
        orderService.confirmOrderPayment(orderId);

        // Second confirmation should fail
        assertThrows(IllegalStateException.class, () -> orderService.confirmOrderPayment(orderId));
    }
}
