package com.bookstore.service;

import com.bookstore.dto.request.StockAdjustmentRequest;
import com.bookstore.dto.response.InventoryTransactionResponse;
import com.bookstore.dto.response.StockLevelResponse;
import com.bookstore.entity.*;
import com.bookstore.exception.BusinessRuleException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.InventoryMapper;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.InventoryTransactionRepository;
import com.bookstore.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Mock
    private InventoryMapper inventoryMapper;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Book testBook;
    private User testUser;

    @BeforeEach
    void setUp() {
        testBook = Book.builder()
                .id(1)
                .title("Test Book")
                .isbn("1234567890")
                .price(BigDecimal.valueOf(29.99))
                .stockQuantity(10)
                .businessStatus(BusinessStatus.ACTIVE)
                .build();

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin@bookstore.com")
                .role(Role.ADMIN)
                .isActive(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getStockByBookId_Success() {
        when(bookRepository.findById(1)).thenReturn(Optional.of(testBook));
        StockLevelResponse response = StockLevelResponse.builder()
                .bookId(1)
                .title("Test Book")
                .isbn("1234567890")
                .stockQuantity(10)
                .businessStatus(BusinessStatus.ACTIVE)
                .build();
        when(inventoryMapper.toStockLevelResponse(testBook)).thenReturn(response);

        StockLevelResponse result = inventoryService.getStockByBookId(1);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Test Book");
        assertThat(result.getStockQuantity()).isEqualTo(10);
    }

    @Test
    void getStockByBookId_NotFound_ThrowsException() {
        when(bookRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> inventoryService.getStockByBookId(999));
    }

    @Test
    void adjustStock_Success() {
        // Mock Security Context
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        UserDetails userDetails = mock(UserDetails.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("admin@bookstore.com");
        SecurityContextHolder.setContext(securityContext);

        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testBook));
        when(userRepository.findByEmail("admin@bookstore.com")).thenReturn(Optional.of(testUser));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        InventoryTransactionResponse response = InventoryTransactionResponse.builder()
                .bookId(1)
                .transactionType(TransactionType.ADJUSTMENT)
                .quantityChange(5)
                .oldQuantity(10)
                .newQuantity(15)
                .build();
        when(inventoryMapper.toTransactionResponse(any(InventoryTransaction.class))).thenReturn(response);

        StockAdjustmentRequest request = new StockAdjustmentRequest(1, 5, "Initial count adjustment");
        InventoryTransactionResponse result = inventoryService.adjustStock(request);

        assertThat(result).isNotNull();
        assertThat(result.getNewQuantity()).isEqualTo(15);
        assertThat(testBook.getStockQuantity()).isEqualTo(15);

        verify(bookRepository).save(testBook);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void adjustStock_NegativeStock_ThrowsException() {
        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testBook));

        StockAdjustmentRequest request = new StockAdjustmentRequest(1, -12, "Reduce too much");
        assertThrows(BusinessRuleException.class, () -> inventoryService.adjustStock(request));

        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    void recordPurchaseTransaction_Success() {
        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testBook));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        inventoryService.recordPurchaseTransaction(1, 10, 100, testUser.getId(), "PO receive");

        assertThat(testBook.getStockQuantity()).isEqualTo(20);
        verify(bookRepository).save(testBook);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void recordSaleTransaction_Success() {
        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testBook));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UUID orderId = UUID.randomUUID();
        inventoryService.recordSaleTransaction(1, 4, orderId, testUser.getId());

        assertThat(testBook.getStockQuantity()).isEqualTo(6);
        verify(bookRepository).save(testBook);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void recordSaleTransaction_InsufficientStock_ThrowsException() {
        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testBook));

        UUID orderId = UUID.randomUUID();
        assertThrows(BusinessRuleException.class, () -> inventoryService.recordSaleTransaction(1, 15, orderId, testUser.getId()));

        verify(bookRepository, never()).save(any(Book.class));
        verify(transactionRepository, never()).save(any(InventoryTransaction.class));
    }

    @Test
    void recordCancelTransaction_Success() {
        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testBook));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UUID orderId = UUID.randomUUID();
        inventoryService.recordCancelTransaction(1, 3, orderId, testUser.getId());

        assertThat(testBook.getStockQuantity()).isEqualTo(13);
        verify(bookRepository).save(testBook);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }
}
