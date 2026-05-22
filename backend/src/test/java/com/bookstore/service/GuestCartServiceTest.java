package com.bookstore.service;

import com.bookstore.dto.request.CartItemRequest;
import com.bookstore.entity.Book;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.concurrent.TimeUnit;
import java.util.Optional;
import java.math.BigDecimal;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GuestCartServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private HashOperations<String, Object, Object> hashOperations;
    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private GuestCartService guestCartService;

    private String sessionId;
    private Integer bookId;
    private Book book;

    @BeforeEach
    void setUp() {
        sessionId = "session-123";
        bookId = 1;
        book = Book.builder()
                .id(bookId)
                .title("Test Book")
                .price(BigDecimal.valueOf(100))
                .stockQuantity(10)
                .businessStatus(BusinessStatus.ACTIVE)
                .build();
    }

    @Test
    void addToCart_Success() {
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        when(hashOperations.get("guest_cart:" + sessionId, bookId.toString())).thenReturn(null);
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        CartItemRequest request = new CartItemRequest(bookId, 2);
        
        guestCartService.addToCart(sessionId, request);

        verify(hashOperations).put("guest_cart:" + sessionId, bookId.toString(), 2);
        verify(redisTemplate).expire("guest_cart:" + sessionId, 7, TimeUnit.DAYS);
    }

    @Test
    void addToCart_ExistingPlusAddedExceedsStock_ThrowsException() {
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        when(hashOperations.get("guest_cart:" + sessionId, bookId.toString())).thenReturn("9");
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        CartItemRequest request = new CartItemRequest(bookId, 2);

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> guestCartService.addToCart(sessionId, request));

        verify(hashOperations, never()).put(any(), any(), any());
    }

    @Test
    void addToCart_MissingSession_ThrowsException() {
        CartItemRequest request = new CartItemRequest(bookId, 2);

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> guestCartService.addToCart(" ", request));
    }

    @Test
    void clearCart_Success() {
        guestCartService.clearCart(sessionId);
        verify(redisTemplate).delete("guest_cart:" + sessionId);
    }
}
