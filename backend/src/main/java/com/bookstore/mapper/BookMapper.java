package com.bookstore.mapper;

import com.bookstore.dto.request.BookRequest;
import com.bookstore.dto.response.BookResponse;
import com.bookstore.entity.Book;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookMapper {
    private final CategoryMapper categoryMapper;
    private final AuthorMapper authorMapper;
    private final PublisherMapper publisherMapper;

    public BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .category(categoryMapper.toResponse(book.getCategory()))
                .author(authorMapper.toResponse(book.getAuthor()))
                .publisher(publisherMapper.toResponse(book.getPublisher()))
                .title(book.getTitle())
                .isbn(book.getIsbn())
                .coverUrl(book.getCoverUrl())
                .publicationYear(book.getPublicationYear())
                .price(book.getPrice())
                .stockQuantity(book.getStockQuantity())
                .description(book.getDescription())
                .businessStatus(book.getBusinessStatus())
                .storageLocation(book.getStorageLocation())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }

    public void updateEntity(Book book, BookRequest request) {
        // Note: Foreign key entities (category, author, publisher) should be set by the service layer
        book.setTitle(request.getTitle());
        book.setIsbn(request.getIsbn());
        book.setCoverUrl(request.getCoverUrl());
        book.setPublicationYear(request.getPublicationYear());
        book.setPrice(request.getPrice());
        book.setStockQuantity(request.getStockQuantity());
        book.setDescription(request.getDescription());
        book.setBusinessStatus(request.getBusinessStatus());
        book.setStorageLocation(request.getStorageLocation());
    }
}
