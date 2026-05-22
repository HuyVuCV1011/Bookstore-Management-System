package com.bookstore.entity.mongodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;

import java.math.BigDecimal;

@Document(collection = "books_search")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSearch {
    @Id
    private Integer id;

    @TextIndexed(weight = 10)
    private String title;

    @TextIndexed(weight = 5)
    private String authorName;

    @TextIndexed(weight = 3)
    private String categoryName;

    @Indexed
    private String isbn;

    private BigDecimal price;
    private Integer publicationYear;
    private String businessStatus;
}
