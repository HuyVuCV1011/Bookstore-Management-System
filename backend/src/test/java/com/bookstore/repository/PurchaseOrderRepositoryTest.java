package com.bookstore.repository;

import com.bookstore.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class PurchaseOrderRepositoryTest {

// Use Testcontainers to spin up an isolated PostgreSQL instance for repository testing,
// avoiding dependence on any external running database instance.
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

    private PurchaseOrder testPurchaseOrder;
    private Supplier testSupplier;
    private User testUser;

    @BeforeEach
    void setUp() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime now = LocalDateTime.now();
        
        testUser = User.builder()
                .email("test-" + uniqueSuffix + "@bookstore.com")
                .password("password")
                .role(Role.STAFF)
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        entityManager.persist(testUser);
        entityManager.flush();

        testSupplier = Supplier.builder()
                .name("Test Supplier " + uniqueSuffix)
                .phone("1234567890")
                .email("supplier-" + uniqueSuffix + "@test.com")
                .status(SupplierStatus.ACTIVE)
                .build();
        testSupplier.setCreatedBy(testUser.getId());
        testSupplier.setUpdatedBy(testUser.getId());
        testSupplier.setCreatedAt(now);
        testSupplier.setUpdatedAt(now);
        entityManager.persist(testSupplier);
        entityManager.flush();

        testPurchaseOrder = PurchaseOrder.builder()
                .poNumber("PO-2026-" + uniqueSuffix)
                .supplier(testSupplier)
                .status(PurchaseOrderStatus.DRAFT)
                .expectedDeliveryDate(LocalDate.now().plusDays(7))
                .totalAmount(BigDecimal.valueOf(1000.00))
                .notes("Test purchase order")
                .build();
        testPurchaseOrder.setCreatedBy(testUser.getId());
        testPurchaseOrder.setUpdatedBy(testUser.getId());
        testPurchaseOrder.setCreatedAt(now);
        testPurchaseOrder.setUpdatedAt(now);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void testSaveAndFindById() {
        PurchaseOrder saved = purchaseOrderRepository.save(testPurchaseOrder);
        entityManager.flush();

        Optional<PurchaseOrder> found = purchaseOrderRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getPoNumber()).isEqualTo(testPurchaseOrder.getPoNumber());
        assertThat(found.get().getStatus()).isEqualTo(PurchaseOrderStatus.DRAFT);
        assertThat(found.get().getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(1000.00));
    }

    @Test
    void testFindByPoNumber() {
        purchaseOrderRepository.save(testPurchaseOrder);
        entityManager.flush();

        Optional<PurchaseOrder> found = purchaseOrderRepository.findByPoNumber(testPurchaseOrder.getPoNumber());

        assertThat(found).isPresent();
        assertThat(found.get().getPoNumber()).isEqualTo(testPurchaseOrder.getPoNumber());
    }

    @Test
    void testFindByStatus() {
        purchaseOrderRepository.save(testPurchaseOrder);
        entityManager.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Page<PurchaseOrder> result = purchaseOrderRepository.findByStatus(PurchaseOrderStatus.DRAFT, pageable);

        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().stream().anyMatch(po -> po.getPoNumber().equals(testPurchaseOrder.getPoNumber()))).isTrue();
    }

    @Test
    void testFindBySupplierId() {
        purchaseOrderRepository.save(testPurchaseOrder);
        entityManager.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Page<PurchaseOrder> result = purchaseOrderRepository.findBySupplierId(testSupplier.getId(), pageable);

        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().stream().anyMatch(po -> po.getPoNumber().equals(testPurchaseOrder.getPoNumber()))).isTrue();
    }

    @Test
    void testFindByKeyword() {
        purchaseOrderRepository.save(testPurchaseOrder);
        entityManager.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Page<PurchaseOrder> result = purchaseOrderRepository.findByKeyword(testPurchaseOrder.getPoNumber(), pageable);

        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().get(0).getPoNumber()).isEqualTo(testPurchaseOrder.getPoNumber());
    }

    @Test
    void testSoftDelete() {
        PurchaseOrder saved = purchaseOrderRepository.save(testPurchaseOrder);
        entityManager.flush();

        saved.setDeletedAt(LocalDateTime.now());
        purchaseOrderRepository.save(saved);
        entityManager.flush();

        Optional<PurchaseOrder> found = purchaseOrderRepository.findById(saved.getId());

        assertThat(found).isEmpty();
    }
}
