package com.bookstore.service;

import com.bookstore.entity.mongodb.Wishlist;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistRepository wishlistRepository;
    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private WishlistService wishlistService;

    private UUID userId;
    private Integer bookId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        bookId = 1;
    }

    @Test
    void addToWishlist_Success() {
        Wishlist wishlist = Wishlist.builder().userId(userId).bookIds(new HashSet<>()).build();
        when(bookRepository.existsById(bookId)).thenReturn(true);
        when(wishlistRepository.findById(userId)).thenReturn(Optional.of(wishlist));

        wishlistService.addToWishlist(userId, bookId);

        assertTrue(wishlist.getBookIds().contains(bookId));
        verify(wishlistRepository).save(wishlist);
    }

    @Test
    void isInWishlist_True() {
        Wishlist wishlist = Wishlist.builder().userId(userId).bookIds(new HashSet<>()).build();
        wishlist.getBookIds().add(bookId);
        when(wishlistRepository.findById(userId)).thenReturn(Optional.of(wishlist));

        boolean result = wishlistService.isInWishlist(userId, bookId);

        assertTrue(result);
    }
}
