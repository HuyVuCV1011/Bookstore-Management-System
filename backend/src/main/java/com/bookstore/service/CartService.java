package com.bookstore.service;

import com.bookstore.dto.request.CartItemRequest;
import com.bookstore.entity.Book;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.entity.mongodb.Cart;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final BookRepository bookRepository;

    public Cart getCart(UUID userId) {
        return cartRepository.findById(userId)
                .orElseGet(() -> Cart.builder().userId(userId).build());
    }

    public void addToCart(UUID userId, CartItemRequest request) {
        Cart cart = getCart(userId);
        Optional<Cart.CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getBookId().equals(request.getBookId()))
                .findFirst();

        if (existingItem.isPresent()) {
            int finalQuantity = existingItem.get().getQuantity() + request.getQuantity();
            validateBookForCart(request.getBookId(), finalQuantity);
            existingItem.get().setQuantity(finalQuantity);
        } else {
            validateBookForCart(request.getBookId(), request.getQuantity());
            cart.getItems().add(Cart.CartItem.builder()
                    .bookId(request.getBookId())
                    .quantity(request.getQuantity())
                    .build());
        }
        cartRepository.save(cart);
    }

    public void updateQuantity(UUID userId, CartItemRequest request) {
        validateBookForCart(request.getBookId(), request.getQuantity());

        Cart cart = getCart(userId);
        cart.getItems().stream()
                .filter(item -> item.getBookId().equals(request.getBookId()))
                .findFirst()
                .ifPresent(item -> {
                    item.setQuantity(request.getQuantity());
                    cartRepository.save(cart);
                });
    }

    public void removeFromCart(UUID userId, Integer bookId) {
        Cart cart = getCart(userId);
        cart.getItems().removeIf(item -> item.getBookId().equals(bookId));
        cartRepository.save(cart);
    }

    public void clearCart(UUID userId) {
        cartRepository.deleteById(userId);
    }

    public void mergeCart(UUID userId, java.util.Map<Object, Object> guestItems) {
        if (guestItems == null || guestItems.isEmpty()) return;

        Cart cart = getCart(userId);
        for (java.util.Map.Entry<Object, Object> entry : guestItems.entrySet()) {
            Integer bookId = Integer.parseInt(entry.getKey().toString());
            Integer quantity = Integer.parseInt(entry.getValue().toString());

            try {
                Optional<Cart.CartItem> existingItem = cart.getItems().stream()
                        .filter(item -> item.getBookId().equals(bookId))
                        .findFirst();

                if (existingItem.isPresent()) {
                    int finalQuantity = existingItem.get().getQuantity() + quantity;
                    validateBookForCart(bookId, finalQuantity);
                    existingItem.get().setQuantity(finalQuantity);
                } else {
                    validateBookForCart(bookId, quantity);
                    cart.getItems().add(Cart.CartItem.builder()
                            .bookId(bookId)
                            .quantity(quantity)
                            .build());
                }
            } catch (Exception e) {
                // Skip items that are no longer valid (out of stock/inactive) during merge
            }
        }
        cartRepository.save(cart);
    }

    private Book validateBookForCart(Integer bookId, Integer quantity) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getBusinessStatus() != BusinessStatus.ACTIVE) {
            throw new IllegalStateException("Book is not active for sale");
        }

        if (book.getStockQuantity() < quantity) {
            throw new IllegalStateException("Insufficient stock. Available: " + book.getStockQuantity());
        }

        return book;
    }
}
