package com.bookstore.service;

import com.bookstore.dto.response.BookResponse;
import com.bookstore.entity.mongodb.BookDetail;
import com.bookstore.mapper.BookDetailMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogQueryServiceTest {

    @Mock
    private BookService bookService;
    @Mock
    private BookSearchService bookSearchService;
    @Mock
    private BookDetailMapper bookDetailMapper;
    @Mock
    private InteractionEventService interactionEventService;

    @InjectMocks
    private CatalogQueryService catalogQueryService;

    private Integer bookId;
    private UUID userId;
    private BookResponse bookResponse;
    private BookDetail bookDetail;

    @BeforeEach
    void setUp() {
        bookId = 1;
        userId = UUID.randomUUID();
        bookResponse = BookResponse.builder()
                .id(bookId)
                .title("Test Book")
                .isbn("1234567890123")
                .price(BigDecimal.valueOf(19.99))
                .build();
        bookDetail = BookDetail.builder()
                .id(bookId)
                .title("Test Book")
                .isbn("1234567890123")
                .price(BigDecimal.valueOf(19.99))
                .build();
    }

    @Test
    void getBookById_PostgresFallback() {
        ReflectionTestUtils.setField(catalogQueryService, "useMongoForReads", false);
        when(bookService.getById(bookId)).thenReturn(bookResponse);

        BookResponse result = catalogQueryService.getBookById(bookId, userId);

        assertNotNull(result);
        assertEquals(bookId, result.getId());
        verify(interactionEventService).trackView(userId, bookId);
        verify(bookService).getById(bookId);
        verifyNoInteractions(bookSearchService);
    }

    @Test
    void getBookById_MongoRead() {
        ReflectionTestUtils.setField(catalogQueryService, "useMongoForReads", true);
        when(bookSearchService.getBookDetailById(bookId)).thenReturn(Optional.of(bookDetail));
        when(bookDetailMapper.toBookResponse(bookDetail)).thenReturn(bookResponse);

        BookResponse result = catalogQueryService.getBookById(bookId, userId);

        assertNotNull(result);
        assertEquals(bookId, result.getId());
        verify(interactionEventService).trackView(userId, bookId);
        verify(bookSearchService).getBookDetailById(bookId);
        verifyNoInteractions(bookService);
    }

    @Test
    void getAllBooks_WithSearchKeyword_Mongo() {
        ReflectionTestUtils.setField(catalogQueryService, "useMongoForReads", true);
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<BookDetail> page = new PageImpl<>(Collections.singletonList(bookDetail), pageRequest, 1L);

        when(bookSearchService.searchBooks("Keyword", PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("id").descending()))).thenReturn(page);
        when(bookDetailMapper.toBookResponse(bookDetail)).thenReturn(bookResponse);

        Page<BookResponse> result = catalogQueryService.getAllBooks(0, 10, "Keyword", userId);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(bookId, result.getContent().get(0).getId());
        verify(interactionEventService).trackSearch(userId, "Keyword", 1);
        verify(bookSearchService).searchBooks(eq("Keyword"), any());
    }
}
