package com.bookstore.service;

import com.bookstore.dto.request.CartItemRequest;
import com.bookstore.entity.Book;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class GuestCartService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final BookRepository bookRepository;
    private static final String CART_KEY_PREFIX = "guest_cart:";
    private static final long TTL_DAYS = 7;

    public void addToCart(String sessionId, CartItemRequest request) {
        String key = cartKey(sessionId);
        int existingQuantity = readQuantity(key, request.getBookId());
        int finalQuantity = existingQuantity + request.getQuantity();
        validateBookForCart(request.getBookId(), finalQuantity);
        redisTemplate.opsForHash().put(key, request.getBookId().toString(), finalQuantity);
        redisTemplate.expire(key, TTL_DAYS, TimeUnit.DAYS);
    }

    public Map<Object, Object> getCart(String sessionId) {
        return redisTemplate.opsForHash().entries(cartKey(sessionId));
    }

    public void updateQuantity(String sessionId, CartItemRequest request) {
        String key = cartKey(sessionId);
        validateBookForCart(request.getBookId(), request.getQuantity());
        if (Boolean.TRUE.equals(redisTemplate.opsForHash().hasKey(key, request.getBookId().toString()))) {
            redisTemplate.opsForHash().put(key, request.getBookId().toString(), request.getQuantity());
            redisTemplate.expire(key, TTL_DAYS, TimeUnit.DAYS);
        }
    }

    public void removeFromCart(String sessionId, Integer bookId) {
        String key = cartKey(sessionId);
        redisTemplate.opsForHash().delete(key, bookId.toString());
    }

    public void clearCart(String sessionId) {
        String key = cartKey(sessionId);
        redisTemplate.delete(key);
    }

    private String cartKey(String sessionId) {
        if (!StringUtils.hasText(sessionId)) {
            throw new IllegalArgumentException("Guest session id is required");
        }
        return CART_KEY_PREFIX + sessionId;
    }

    private int readQuantity(String key, Integer bookId) {
        Object value = redisTemplate.opsForHash().get(key, bookId.toString());
        return value == null ? 0 : Integer.parseInt(value.toString());
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
