package com.bookstore.service;

import com.bookstore.entity.mongodb.Wishlist;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final BookRepository bookRepository;

    public Wishlist getWishlist(UUID userId) {
        return wishlistRepository.findById(userId)
                .orElseGet(() -> Wishlist.builder().userId(userId).build());
    }

    public void addToWishlist(UUID userId, Integer bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book not found");
        }
        
        Wishlist wishlist = getWishlist(userId);
        wishlist.getBookIds().add(bookId);
        wishlistRepository.save(wishlist);
    }

    public void removeFromWishlist(UUID userId, Integer bookId) {
        Wishlist wishlist = getWishlist(userId);
        wishlist.getBookIds().remove(bookId);
        wishlistRepository.save(wishlist);
    }

    public boolean isInWishlist(UUID userId, Integer bookId) {
        Wishlist wishlist = getWishlist(userId);
        return wishlist.getBookIds().contains(bookId);
    }
}
