package com.bookstore.service;

import com.bookstore.dto.request.CartItemRequest;
import com.bookstore.entity.Book;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.entity.mongodb.Cart;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.CartRepository;
import com.bookstore.exception.InsufficientStockException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private CartService cartService;

    private UUID userId;
    private Integer bookId;
    private Book book;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
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
        CartItemRequest request = new CartItemRequest(bookId, 2);
        Cart cart = Cart.builder().userId(userId).build();

        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));

        cartService.addToCart(userId, request);

        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItems().get(0).getQuantity());
        verify(cartRepository).save(cart);
    }

    @Test
    void addToCart_OutOfStock_ThrowsException() {
        CartItemRequest request = new CartItemRequest(bookId, 15);
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));

        assertThrows(InsufficientStockException.class, () -> cartService.addToCart(userId, request));
    }

    @Test
    void addToCart_ExistingPlusAddedExceedsStock_ThrowsException() {
        CartItemRequest request = new CartItemRequest(bookId, 3);
        Cart cart = Cart.builder().userId(userId).build();
        cart.getItems().add(Cart.CartItem.builder()
                .bookId(bookId)
                .quantity(8)
                .build());

        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));

        assertThrows(InsufficientStockException.class, () -> cartService.addToCart(userId, request));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void mergeCart_Success() {
        Map<Object, Object> guestItems = new HashMap<>();
        guestItems.put(bookId.toString(), "3");
        
        Cart cart = Cart.builder().userId(userId).build();

        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));

        cartService.mergeCart(userId, guestItems);

        assertEquals(1, cart.getItems().size());
        assertEquals(3, cart.getItems().get(0).getQuantity());
        verify(cartRepository).save(cart);
    }

    @Test
    void mergeCart_ExistingPlusGuestExceedsStock_SkipsItem() {
        Map<Object, Object> guestItems = new HashMap<>();
        guestItems.put(bookId.toString(), "3");

        Cart cart = Cart.builder().userId(userId).build();
        cart.getItems().add(Cart.CartItem.builder()
                .bookId(bookId)
                .quantity(8)
                .build());

        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));

        cartService.mergeCart(userId, guestItems);

        assertEquals(8, cart.getItems().get(0).getQuantity());
        verify(cartRepository).save(cart);
    }
}
