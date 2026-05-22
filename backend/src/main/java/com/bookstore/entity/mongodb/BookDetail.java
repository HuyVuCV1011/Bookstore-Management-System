package com.bookstore.entity.mongodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "book_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookDetail {

    @Id
    private Integer id;

    @TextIndexed(weight = 10)
    private String title;

    @Indexed
    private String isbn;

    private BigDecimal price;

    private Integer stockQuantity;

    private Integer publicationYear;

    private String businessStatus;

    private String description;

    private String storageLocation;

    @TextIndexed(weight = 5)
    private AuthorInfo author;

    @TextIndexed(weight = 3)
    private CategoryInfo category;

    private PublisherInfo publisher;

    private LocalDateTime lastSyncedAt;
}
