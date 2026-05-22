package com.bookstore.mapper;

import com.bookstore.entity.*;
import com.bookstore.dto.response.PurchaseOrderDetailResponse;
import com.bookstore.dto.response.PurchaseOrderItemResponse;
import com.bookstore.dto.response.PurchaseOrderResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PurchaseOrderMapperTest {

    private PurchaseOrderMapper mapper;
    private PurchaseOrder purchaseOrder;
    private PurchaseOrderItem item;

    @BeforeEach
    void setUp() {
        mapper = new PurchaseOrderMapper();

        Supplier supplier = Supplier.builder()
                .id(1)
                .name("Test Supplier")
                .phone("1234567890")
                .email("supplier@test.com")
                .status(SupplierStatus.ACTIVE)
                .build();

        Category category = Category.builder()
                .id(1)
                .name("Test Category")
                .build();

        Author author = Author.builder()
                .id(1)
                .name("Test Author")
                .build();

        Publisher publisher = Publisher.builder()
                .id(1)
                .name("Test Publisher")
                .build();

        Book book = Book.builder()
                .id(1)
                .title("Test Book")
                .isbn("1234567890123")
                .price(BigDecimal.valueOf(100))
                .stockQuantity(10)
                .publicationYear(2024)
                .category(category)
                .author(author)
                .publisher(publisher)
                .businessStatus(BusinessStatus.ACTIVE)
                .build();

        item = PurchaseOrderItem.builder()
                .id(1)
                .book(book)
                .quantityOrdered(10)
                .quantityReceived(5)
                .unitCost(BigDecimal.valueOf(80))
                .lineTotal(BigDecimal.valueOf(800))
                .notes("Test item notes")
                .build();

        purchaseOrder = PurchaseOrder.builder()
                .id(1)
                .poNumber("PO-2026-0001")
                .supplier(supplier)
                .status(PurchaseOrderStatus.RECEIVING)
                .orderDate(LocalDateTime.now())
                .expectedDeliveryDate(LocalDate.now().plusDays(7))
                .totalAmount(BigDecimal.valueOf(800))
                .notes("Test PO notes")
                .items(new ArrayList<>())
                .build();
        purchaseOrder.setCreatedBy(UUID.randomUUID());
        purchaseOrder.setCreatedAt(LocalDateTime.now());
        purchaseOrder.setUpdatedAt(LocalDateTime.now());
        purchaseOrder.addItem(item);
    }

    @Test
    void toResponse_ShouldMapAllFields() {
        PurchaseOrderResponse response = mapper.toResponse(purchaseOrder);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1);
        assertThat(response.getPoNumber()).isEqualTo("PO-2026-0001");
        assertThat(response.getSupplierId()).isEqualTo(1);
        assertThat(response.getSupplierName()).isEqualTo("Test Supplier");
        assertThat(response.getStatus()).isEqualTo(PurchaseOrderStatus.RECEIVING);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(800));
        assertThat(response.getNotes()).isEqualTo("Test PO notes");
    }

    @Test
    void toResponse_WithNullInput_ShouldReturnNull() {
        PurchaseOrderResponse response = mapper.toResponse(null);

        assertThat(response).isNull();
    }

    @Test
    void toDetailResponse_ShouldMapAllFields() {
        PurchaseOrderDetailResponse response = mapper.toDetailResponse(purchaseOrder);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1);
        assertThat(response.getPoNumber()).isEqualTo("PO-2026-0001");
        assertThat(response.getItems()).hasSize(1);
    }

    @Test
    void toDetailResponse_ShouldMapItems() {
        PurchaseOrderDetailResponse response = mapper.toDetailResponse(purchaseOrder);

        assertThat(response.getItems()).hasSize(1);
        PurchaseOrderItemResponse itemResponse = response.getItems().get(0);
        assertThat(itemResponse.getId()).isEqualTo(1);
        assertThat(itemResponse.getBookId()).isEqualTo(1);
        assertThat(itemResponse.getBookTitle()).isEqualTo("Test Book");
        assertThat(itemResponse.getQuantityOrdered()).isEqualTo(10);
        assertThat(itemResponse.getQuantityReceived()).isEqualTo(5);
        assertThat(itemResponse.getQuantityRemaining()).isEqualTo(5);
    }

    @Test
    void toItemResponse_ShouldMapAllFields() {
        PurchaseOrderItemResponse response = mapper.toItemResponse(item);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1);
        assertThat(response.getBookId()).isEqualTo(1);
        assertThat(response.getBookTitle()).isEqualTo("Test Book");
        assertThat(response.getBookIsbn()).isEqualTo("1234567890123");
        assertThat(response.getQuantityOrdered()).isEqualTo(10);
        assertThat(response.getQuantityReceived()).isEqualTo(5);
        assertThat(response.getQuantityRemaining()).isEqualTo(5);
        assertThat(response.getUnitCost()).isEqualByComparingTo(BigDecimal.valueOf(80));
        assertThat(response.getLineTotal()).isEqualByComparingTo(BigDecimal.valueOf(800));
        assertThat(response.getNotes()).isEqualTo("Test item notes");
    }

    @Test
    void toItemResponse_WithNullInput_ShouldReturnNull() {
        PurchaseOrderItemResponse response = mapper.toItemResponse(null);

        assertThat(response).isNull();
    }
}
