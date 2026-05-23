package com.bookstore.service;

import com.bookstore.config.AuditConfig;
import com.bookstore.dto.request.CreatePurchaseOrderRequest;
import com.bookstore.dto.request.PurchaseOrderItemRequest;
import com.bookstore.dto.request.ReceiveGoodsRequest;
import com.bookstore.dto.request.ReceiveItemRequest;
import com.bookstore.entity.*;
import com.bookstore.mapper.PurchaseOrderMapper;
import com.bookstore.repository.*;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.exception.BusinessRuleException;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
@Import({
    AuditConfig.class,
    PurchaseOrderService.class,
    InventoryService.class,
    com.bookstore.mapper.InventoryMapper.class,
    com.bookstore.mapper.PurchaseOrderMapper.class
})
class PurchaseOrderServiceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("bookstore")
            .withUsername("bookstore_user")
            .withPassword("password");

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    private User testUser;
    private Supplier testSupplier;
    private Book testBook;
    private Category testCategory;
    private Author testAuthor;
    private Publisher testPublisher;

    @BeforeEach
    void setUp() {
        transactionTemplate = new org.springframework.transaction.support.TransactionTemplate(transactionManager);

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime now = LocalDateTime.now();

        transactionTemplate.executeWithoutResult(status -> {
            // 1. Create Staff User
            testUser = User.builder()
                    .email("staff-" + uniqueSuffix + "@bookstore.com")
                    .password("password")
                    .role(Role.STAFF)
                    .isActive(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            entityManager.persist(testUser);

            // 2. Create Supplier
            testSupplier = Supplier.builder()
                    .name("Supplier " + uniqueSuffix)
                    .phone("1234567890")
                    .email("supplier-" + uniqueSuffix + "@test.com")
                    .status(SupplierStatus.ACTIVE)
                    .build();
            testSupplier.setCreatedBy(testUser.getId());
            testSupplier.setUpdatedBy(testUser.getId());
            testSupplier.setCreatedAt(now);
            testSupplier.setUpdatedAt(now);
            entityManager.persist(testSupplier);

            // 3. Create book dependencies
            testCategory = Category.builder().name("Category " + uniqueSuffix).build();
            entityManager.persist(testCategory);

            testAuthor = Author.builder().name("Author " + uniqueSuffix).build();
            entityManager.persist(testAuthor);

            testPublisher = Publisher.builder().name("Publisher " + uniqueSuffix).build();
            entityManager.persist(testPublisher);

            // 4. Create Book with initial stock 5
            testBook = Book.builder()
                    .title("Book Title " + uniqueSuffix)
                    .isbn("ISBN-" + uniqueSuffix)
                    .price(BigDecimal.valueOf(150.00))
                    .stockQuantity(5)
                    .publicationYear(2026)
                    .businessStatus(BusinessStatus.ACTIVE)
                    .category(testCategory)
                    .author(testAuthor)
                    .publisher(testPublisher)
                    .build();
            entityManager.persist(testBook);

            entityManager.flush();
            entityManager.clear();
        });

        // 5. Mock Security context
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
    void testReceiveGoods_Success_IncreasesStock() {
        // Create draft PO (construct requests directly, no builders available)
        PurchaseOrderItemRequest itemRequest = new PurchaseOrderItemRequest(
                testBook.getId(),
                10,
                BigDecimal.valueOf(90.00),
                "Ref order"
        );

        CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                testSupplier.getId(),
                LocalDate.now().plusDays(5),
                "PO test",
                Collections.singletonList(itemRequest)
        );

        var poResponse = purchaseOrderService.create(poRequest);
        Integer poId = poResponse.getId();

        // Submit PO to change status to SUBMITTED
        purchaseOrderService.submit(poId);

        // Retrieve purchase order item ID
        PurchaseOrder po = purchaseOrderRepository.findById(poId).orElseThrow();
        PurchaseOrderItem poItem = po.getItems().iterator().next();
        Integer poItemId = poItem.getId();

        // Receive 6 units of the goods
        ReceiveItemRequest receiveItemRequest = new ReceiveItemRequest(poItemId, 6);
        ReceiveGoodsRequest receiveRequest = new ReceiveGoodsRequest(Collections.singletonList(receiveItemRequest));

        var receiveResponse = purchaseOrderService.receiveGoods(poId, receiveRequest);

        assertThat(receiveResponse).isNotNull();
        assertThat(receiveResponse.getStatus()).isEqualTo(PurchaseOrderStatus.RECEIVING);

        // Verify stock increased: 5 (initial) + 6 (received) = 11
        Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(updatedBook.getStockQuantity()).isEqualTo(11);
    }

    @Test
    void testReceiveGoods_OverReceive_ThrowsException() {
        // Create draft PO
        PurchaseOrderItemRequest itemRequest = new PurchaseOrderItemRequest(
                testBook.getId(),
                10,
                BigDecimal.valueOf(90.00),
                "Ref order"
        );

        CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                testSupplier.getId(),
                LocalDate.now().plusDays(5),
                "PO test",
                Collections.singletonList(itemRequest)
        );

        var poResponse = purchaseOrderService.create(poRequest);
        Integer poId = poResponse.getId();

        // Submit PO
        purchaseOrderService.submit(poId);

        PurchaseOrder po = purchaseOrderRepository.findById(poId).orElseThrow();
        PurchaseOrderItem poItem = po.getItems().iterator().next();
        Integer poItemId = poItem.getId();

        // Attempt to receive 11 units (ordered 10)
        ReceiveItemRequest receiveItemRequest = new ReceiveItemRequest(poItemId, 11);
        ReceiveGoodsRequest receiveRequest = new ReceiveGoodsRequest(Collections.singletonList(receiveItemRequest));

        assertThrows(BusinessRuleException.class, () -> purchaseOrderService.receiveGoods(poId, receiveRequest));

        // Verify stock is unchanged
        Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertThat(updatedBook.getStockQuantity()).isEqualTo(5);
    }

    @Test
    void testReceiveGoods_PartialReceive_Success() {
        PurchaseOrderItemRequest itemRequest = new PurchaseOrderItemRequest(
                testBook.getId(),
                10,
                BigDecimal.valueOf(90.00),
                "Ref order"
        );
        CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                testSupplier.getId(),
                LocalDate.now().plusDays(5),
                "PO test",
                Collections.singletonList(itemRequest)
        );
        var poResponse = purchaseOrderService.create(poRequest);
        Integer poId = poResponse.getId();
        purchaseOrderService.submit(poId);

        PurchaseOrder po = purchaseOrderRepository.findById(poId).orElseThrow();
        PurchaseOrderItem poItem = po.getItems().iterator().next();
        Integer poItemId = poItem.getId();

        // Receive 4 units
        ReceiveItemRequest receiveItemRequest1 = new ReceiveItemRequest(poItemId, 4);
        var receiveResponse1 = purchaseOrderService.receiveGoods(poId, new ReceiveGoodsRequest(Collections.singletonList(receiveItemRequest1)));
        assertThat(receiveResponse1.getStatus()).isEqualTo(PurchaseOrderStatus.RECEIVING);

        // Verify stock is 5 + 4 = 9
        assertThat(bookRepository.findById(testBook.getId()).orElseThrow().getStockQuantity()).isEqualTo(9);

        // Receive another 3 units
        ReceiveItemRequest receiveItemRequest2 = new ReceiveItemRequest(poItemId, 3);
        var receiveResponse2 = purchaseOrderService.receiveGoods(poId, new ReceiveGoodsRequest(Collections.singletonList(receiveItemRequest2)));
        assertThat(receiveResponse2.getStatus()).isEqualTo(PurchaseOrderStatus.RECEIVING);

        // Verify stock is 9 + 3 = 12
        assertThat(bookRepository.findById(testBook.getId()).orElseThrow().getStockQuantity()).isEqualTo(12);
    }

    @Test
    void testReceiveGoods_FullReceive_CompletesPO() {
        PurchaseOrderItemRequest itemRequest = new PurchaseOrderItemRequest(
                testBook.getId(),
                10,
                BigDecimal.valueOf(90.00),
                "Ref order"
        );
        CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                testSupplier.getId(),
                LocalDate.now().plusDays(5),
                "PO test",
                Collections.singletonList(itemRequest)
        );
        var poResponse = purchaseOrderService.create(poRequest);
        Integer poId = poResponse.getId();
        purchaseOrderService.submit(poId);

        PurchaseOrder po = purchaseOrderRepository.findById(poId).orElseThrow();
        PurchaseOrderItem poItem = po.getItems().iterator().next();
        Integer poItemId = poItem.getId();

        // Receive all 10 units
        ReceiveItemRequest receiveItemRequest = new ReceiveItemRequest(poItemId, 10);
        var receiveResponse = purchaseOrderService.receiveGoods(poId, new ReceiveGoodsRequest(Collections.singletonList(receiveItemRequest)));
        assertThat(receiveResponse.getStatus()).isEqualTo(PurchaseOrderStatus.COMPLETED);
        assertThat(receiveResponse.getCompletedAt()).isNotNull();

        // Verify stock is 5 + 10 = 15
        assertThat(bookRepository.findById(testBook.getId()).orElseThrow().getStockQuantity()).isEqualTo(15);
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void testConcurrentCreatePurchaseOrders_NoCollisions() throws InterruptedException {
        int threadCount = 8;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.List<String> poNumbers = Collections.synchronizedList(new java.util.ArrayList<>());
        java.util.List<Throwable> exceptions = Collections.synchronizedList(new java.util.ArrayList<>());

        // Pre-create tasks
        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    // Set authentication on thread
                    CustomUserDetails userDetails = new CustomUserDetails(
                            testUser.getId(),
                            testUser.getEmail(),
                            testUser.getPassword(),
                            true,
                            AuthorityUtils.createAuthorityList("ROLE_" + testUser.getRole().name())
                    );
                    Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    PurchaseOrderItemRequest itemRequest = new PurchaseOrderItemRequest(
                            testBook.getId(),
                            1,
                            BigDecimal.valueOf(90.00),
                            "Concurrent test"
                    );
                    CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                            testSupplier.getId(),
                            LocalDate.now().plusDays(5),
                            "PO concurrent",
                            Collections.singletonList(itemRequest)
                    );
                    var poResponse = purchaseOrderService.create(poRequest);
                    poNumbers.add(poResponse.getPoNumber());
                } catch (Throwable t) {
                    exceptions.add(t);
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
        }

        // Release latch
        latch.countDown();
        executor.shutdown();
        executor.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);

        assertThat(exceptions).isEmpty();
        assertThat(poNumbers).hasSize(threadCount);
        // Assert all generated PO numbers are unique
        assertThat(new java.util.HashSet<>(poNumbers)).hasSize(threadCount);
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void testConcurrentReceiveGoods_DoesNotOverReceive() throws InterruptedException {
        final Integer[] poIdArr = new Integer[1];
        final Integer[] poItemIdArr = new Integer[1];

        transactionTemplate.executeWithoutResult(status -> {
            PurchaseOrderItemRequest itemRequest = new PurchaseOrderItemRequest(
                    testBook.getId(),
                    10,
                    BigDecimal.valueOf(90.00),
                    "Concurrent receive test"
            );
            CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                    testSupplier.getId(),
                    LocalDate.now().plusDays(5),
                    "PO concurrent receive",
                    Collections.singletonList(itemRequest)
            );
            var poResponse = purchaseOrderService.create(poRequest);
            poIdArr[0] = poResponse.getId();
            purchaseOrderService.submit(poIdArr[0]);

            PurchaseOrder po = purchaseOrderRepository.findById(poIdArr[0]).orElseThrow();
            PurchaseOrderItem poItem = po.getItems().iterator().next();
            poItemIdArr[0] = poItem.getId();
        });

        Integer poId = poIdArr[0];
        Integer poItemId = poItemIdArr[0];

        int threadCount = 4;
        int receiveAmountPerThread = 3; // Total requested = 12 (exceeds ordered 10)

        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.List<Throwable> exceptions = Collections.synchronizedList(new java.util.ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    // Set auth context
                    CustomUserDetails userDetails = new CustomUserDetails(
                            testUser.getId(),
                            testUser.getEmail(),
                            testUser.getPassword(),
                            true,
                            AuthorityUtils.createAuthorityList("ROLE_" + testUser.getRole().name())
                    );
                    Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    ReceiveItemRequest receiveItemRequest = new ReceiveItemRequest(poItemId, receiveAmountPerThread);
                    purchaseOrderService.receiveGoods(poId, new ReceiveGoodsRequest(Collections.singletonList(receiveItemRequest)));
                } catch (Throwable t) {
                    exceptions.add(t);
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
        }

        latch.countDown();
        executor.shutdown();
        executor.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);

        for (Throwable t : exceptions) {
            System.err.println("CONCURRENT TEST EXCEPTION: " + t.getMessage());
            t.printStackTrace();
        }

        // At least one thread should have failed with BusinessRuleException
        assertThat(exceptions).isNotEmpty();
        assertThat(exceptions.stream().anyMatch(t -> t.getCause() instanceof BusinessRuleException || t instanceof BusinessRuleException)).isTrue();

        // Verify final received quantity in DB is <= 10 (should be exactly 9, since 3 threads succeed)
        transactionTemplate.executeWithoutResult(status -> {
            PurchaseOrder finalPo = purchaseOrderRepository.findById(poId).orElseThrow();
            PurchaseOrderItem finalItem = finalPo.getItems().iterator().next();
            assertThat(finalItem.getQuantityReceived()).isEqualTo(9);

            // Verify stock matches: 5 (initial) + 9 (received) = 14
            Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
            assertThat(updatedBook.getStockQuantity()).isEqualTo(14);
        });
    }
}
