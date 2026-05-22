package com.bookstore.mapper;

import com.bookstore.entity.Book;
import com.bookstore.entity.mongodb.AuthorInfo;
import com.bookstore.entity.mongodb.BookDetail;
import com.bookstore.entity.mongodb.CategoryInfo;
import com.bookstore.entity.mongodb.PublisherInfo;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class BookDetailMapper {

    public BookDetail toBookDetail(Book book) {
        if (book == null) {
            return null;
        }

        return BookDetail.builder()
                .id(book.getId())
                .title(book.getTitle())
                .isbn(book.getIsbn())
                .price(book.getPrice())
                .stockQuantity(book.getStockQuantity())
                .publicationYear(book.getPublicationYear())
                .businessStatus(book.getBusinessStatus() != null ? book.getBusinessStatus().name() : null)
                .description(book.getDescription())
                .storageLocation(book.getStorageLocation())
                .author(mapAuthorInfo(book))
                .category(mapCategoryInfo(book))
                .publisher(mapPublisherInfo(book))
                .lastSyncedAt(LocalDateTime.now())
                .build();
    }

    private AuthorInfo mapAuthorInfo(Book book) {
        if (book.getAuthor() == null) {
            return null;
        }
        return AuthorInfo.builder()
                .id(book.getAuthor().getId())
                .name(book.getAuthor().getName())
                .biography(book.getAuthor().getBiography())
                .build();
    }

    private CategoryInfo mapCategoryInfo(Book book) {
        if (book.getCategory() == null) {
            return null;
        }
        return CategoryInfo.builder()
                .id(book.getCategory().getId())
                .name(book.getCategory().getName())
                .description(book.getCategory().getDescription())
                .build();
    }

    private PublisherInfo mapPublisherInfo(Book book) {
        if (book.getPublisher() == null) {
            return null;
        }
        return PublisherInfo.builder()
                .id(book.getPublisher().getId())
                .name(book.getPublisher().getName())
                .address(book.getPublisher().getAddress())
                .phone(book.getPublisher().getPhone())
                .email(book.getPublisher().getEmail())
                .build();
    }

    public com.bookstore.dto.response.BookResponse toBookResponse(BookDetail bookDetail) {
        if (bookDetail == null) {
            return null;
        }

        return com.bookstore.dto.response.BookResponse.builder()
                .id(bookDetail.getId())
                .title(bookDetail.getTitle())
                .isbn(bookDetail.getIsbn())
                .price(bookDetail.getPrice())
                .stockQuantity(bookDetail.getStockQuantity())
                .publicationYear(bookDetail.getPublicationYear())
                .businessStatus(bookDetail.getBusinessStatus() != null ?
                    com.bookstore.entity.BusinessStatus.valueOf(bookDetail.getBusinessStatus()) : null)
                .description(bookDetail.getDescription())
                .storageLocation(bookDetail.getStorageLocation())
                .author(bookDetail.getAuthor() != null ?
                    com.bookstore.dto.response.AuthorResponse.builder()
                        .id(bookDetail.getAuthor().getId())
                        .name(bookDetail.getAuthor().getName())
                        .biography(bookDetail.getAuthor().getBiography())
                        .build() : null)
                .category(bookDetail.getCategory() != null ?
                    com.bookstore.dto.response.CategoryResponse.builder()
                        .id(bookDetail.getCategory().getId())
                        .name(bookDetail.getCategory().getName())
                        .description(bookDetail.getCategory().getDescription())
                        .build() : null)
                .publisher(bookDetail.getPublisher() != null ?
                    com.bookstore.dto.response.PublisherResponse.builder()
                        .id(bookDetail.getPublisher().getId())
                        .name(bookDetail.getPublisher().getName())
                        .address(bookDetail.getPublisher().getAddress())
                        .phone(bookDetail.getPublisher().getPhone())
                        .email(bookDetail.getPublisher().getEmail())
                        .build() : null)
                .build();
    }
}
