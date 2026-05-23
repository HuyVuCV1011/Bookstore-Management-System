package com.bookstore.service;

import com.bookstore.dto.response.*;
import com.bookstore.entity.Book;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.entity.Customer;
import com.bookstore.entity.User;
import com.bookstore.graph.repository.BookGraphRepository;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.CustomerRepository;
import com.bookstore.repository.mongodb.BookDetailRepository;
import com.bookstore.repository.mongodb.CartRepository;
import com.bookstore.repository.mongodb.WishlistRepository;
import com.bookstore.repository.cassandra.SessionRepository;
import com.bookstore.repository.cassandra.InteractionEventByUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminFacadeServicesTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private BookDetailRepository bookDetailRepository;
    @Mock
    private BookGraphRepository bookGraphRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private InteractionEventByUserRepository interactionEventByUserRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private WishlistRepository wishlistRepository;

    @InjectMocks
    private AdminCatalogOverviewService catalogOverviewService;

    @InjectMocks
    private AdminCustomerOverviewService customerOverviewService;

    @Test
    void getCatalogOverview_Success() {
        Book book = Book.builder()
                .id(1)
                .title("Test Book")
                .isbn("1234567890")
                .price(BigDecimal.TEN)
                .stockQuantity(50)
                .businessStatus(BusinessStatus.ACTIVE)
                .build();

        Page<Book> bookPage = new PageImpl<>(List.of(book), PageRequest.of(0, 20), 1);
        when(bookRepository.findAll(any(Pageable.class))).thenReturn(bookPage);
        when(bookDetailRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(bookGraphRepository.findExistingIsbns(any())).thenReturn(List.of("1234567890"));

        Page<AdminBookOverview> overviewPage = catalogOverviewService.getCatalogOverview(PageRequest.of(0, 20), null);

        assertNotNull(overviewPage);
        assertEquals(1, overviewPage.getTotalElements());
        AdminBookOverview overview = overviewPage.getContent().get(0);
        assertEquals("Test Book", overview.getTitle());
        assertFalse(overview.isMongoSynced());
        assertTrue(overview.isNeo4jSynced());
    }

    @Test
    void getCustomersOverview_Success() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("customer@test.com")
                .isActive(true)
                .build();

        Customer customer = Customer.builder()
                .id(1)
                .user(user)
                .email("customer@test.com")
                .fullName("Test Customer")
                .build();
        customer.setCreatedAt(LocalDateTime.now());

        Page<Customer> customerPage = new PageImpl<>(List.of(customer), PageRequest.of(0, 20), 1);
        when(customerRepository.findAllActive(any(Pageable.class))).thenReturn(customerPage);
        when(cartRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(wishlistRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(sessionRepository.findByUserId(any())).thenReturn(Collections.emptyList());
        when(interactionEventByUserRepository.countByUserId(any())).thenReturn(5L);

        Page<AdminCustomerOverview> overviewPage = customerOverviewService.getCustomersOverview(PageRequest.of(0, 20), null);

        assertNotNull(overviewPage);
        assertEquals(1, overviewPage.getTotalElements());
        AdminCustomerOverview overview = overviewPage.getContent().get(0);
        assertEquals("Test Customer", overview.getFullName());
        assertEquals(5L, overview.getTotalEventsCount());
        assertEquals(0, overview.getActiveSessionsCount());
    }
}
