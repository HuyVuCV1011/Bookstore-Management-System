package com.bookstore.service;

import com.bookstore.dto.request.ReviewRequest;
import com.bookstore.entity.Book;
import com.bookstore.entity.Customer;
import com.bookstore.entity.mongodb.Review;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.CustomerRepository;
import com.bookstore.repository.OrderRepository;
import com.bookstore.repository.mongodb.ReviewRepository;
import com.bookstore.graph.service.GraphInteractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private BookRepository bookRepository;
    @Mock
    private GraphInteractionService graphInteractionService;

    @InjectMocks
    private ReviewService reviewService;

    private UUID userId;
    private Integer customerId;
    private Integer bookId;
    private Review review;
    private ReviewRequest reviewRequest;
    private Customer customer;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        customerId = 1;
        bookId = 100;
        review = Review.builder()
                .userId(userId)
                .bookId(bookId)
                .rating(5)
                .comment("Great book!")
                .build();
        reviewRequest = new ReviewRequest(bookId, 5, "Great book!");
        customer = Customer.builder()
                .id(customerId)
                .build();
    }

    @Test
    void createReview_Success() {
        when(customerRepository.findActiveByUserId(userId)).thenReturn(Optional.of(customer));
        when(orderRepository.hasPurchasedBook(customerId, bookId)).thenReturn(true);
        when(reviewRepository.existsByBookIdAndUserId(bookId, userId)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review r = invocation.getArgument(0);
            r.setId("rev123");
            return r;
        });

        reviewService.createReview(reviewRequest, userId);

        verify(reviewRepository).save(any(Review.class));
        verify(reviewRepository).save(argThat(savedReview -> !savedReview.getModerated()));
    }

    @Test
    void createReview_NotPurchased_ThrowsException() {
        when(customerRepository.findActiveByUserId(userId)).thenReturn(Optional.of(customer));
        when(orderRepository.hasPurchasedBook(customerId, bookId)).thenReturn(false);

        assertThrows(IllegalStateException.class, () -> reviewService.createReview(reviewRequest, userId));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void approveReview_Success() {
        String reviewId = "rev123";
        review.setId(reviewId);
        review.setModerated(false);
        Book book = Book.builder()
                .id(bookId)
                .isbn("1234567890")
                .build();

        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));

        reviewService.approveReview(reviewId);

        assertTrue(review.getModerated());
        verify(reviewRepository).save(review);
    }
}
