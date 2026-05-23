package com.bookstore.service;

import com.bookstore.dto.response.AdminCustomerOverview;
import com.bookstore.entity.Customer;
import com.bookstore.entity.SessionEntity;
import com.bookstore.entity.mongodb.Cart;
import com.bookstore.entity.mongodb.Wishlist;
import com.bookstore.repository.CustomerRepository;
import com.bookstore.repository.cassandra.SessionRepository;
import com.bookstore.repository.cassandra.InteractionEventByUserRepository;
import com.bookstore.repository.mongodb.CartRepository;
import com.bookstore.repository.mongodb.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCustomerOverviewService {

    private final CustomerRepository customerRepository;
    private final SessionRepository sessionRepository;
    private final InteractionEventByUserRepository interactionEventByUserRepository;
    private final CartRepository cartRepository;
    private final WishlistRepository wishlistRepository;

    public Page<AdminCustomerOverview> getCustomersOverview(Pageable pageable, String keyword) {
        Page<Customer> customersPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            customersPage = customerRepository.searchActive(keyword.trim(), pageable);
        } else {
            customersPage = customerRepository.findAllActive(pageable);
        }

        List<Customer> customers = customersPage.getContent();
        if (customers.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, customersPage.getTotalElements());
        }

        List<UUID> userIds = customers.stream()
                .map(c -> c.getUser().getId())
                .collect(Collectors.toList());

        // Batch find in Mongo
        Map<UUID, Cart> cartMap = cartRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(Cart::getUserId, c -> c));

        Map<UUID, Wishlist> wishlistMap = wishlistRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(Wishlist::getUserId, w -> w));

        Instant now = Instant.now();

        List<AdminCustomerOverview> overviewList = customers.stream().map(customer -> {
            UUID userId = customer.getUser().getId();

            // Cart item count (sum of quantities)
            Cart cart = cartMap.get(userId);
            int cartItemsCount = 0;
            if (cart != null && cart.getItems() != null) {
                cartItemsCount = cart.getItems().stream()
                        .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                        .sum();
            }

            // Wishlist items count
            Wishlist wishlist = wishlistMap.get(userId);
            int wishlistItemsCount = 0;
            if (wishlist != null && wishlist.getBookIds() != null) {
                wishlistItemsCount = wishlist.getBookIds().size();
            }

            // Active sessions count from Cassandra
            long activeSessionsCount = 0;
            try {
                List<SessionEntity> sessions = sessionRepository.findByUserId(userId);
                activeSessionsCount = sessions.stream()
                        .filter(s -> !Boolean.TRUE.equals(s.getRevoked()) && s.getExpiresAt().isAfter(now))
                        .count();
            } catch (Exception e) {
                // Ignore Cassandra session check failure
            }

            // Total event counts from Cassandra
            long totalEventsCount = 0;
            try {
                totalEventsCount = interactionEventByUserRepository.countByUserId(userId);
            } catch (Exception e) {
                // Ignore Cassandra event check failure
            }

            LocalDateTime createdAt = customer.getCreatedAt();
            if (createdAt == null && customer.getUser().getCreatedAt() != null) {
                createdAt = customer.getUser().getCreatedAt();
            }
            if (createdAt == null) {
                createdAt = LocalDateTime.now();
            }

            return AdminCustomerOverview.builder()
                    .id(userId.toString())
                    .email(customer.getEmail())
                    .fullName(customer.getFullName())
                    .phoneNumber(customer.getPhoneNumber())
                    .address(customer.getAddress())
                    .isActive(Boolean.TRUE.equals(customer.getUser().getIsActive()))
                    .createdAt(createdAt)
                    .activeSessionsCount(activeSessionsCount)
                    .totalEventsCount(totalEventsCount)
                    .cartItemsCount(cartItemsCount)
                    .wishlistItemsCount(wishlistItemsCount)
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(overviewList, pageable, customersPage.getTotalElements());
    }
}
