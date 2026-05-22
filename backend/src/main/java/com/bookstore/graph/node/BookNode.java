package com.bookstore.graph.node;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Book")
@Data
public class BookNode {

    @Id
    private String isbn;

    private String title;
    private String language;
    private Integer publishedYear;
    private Double avgRating;
    private Integer ratingCount;
    private Integer purchaseCount;
    private Double price;
    private String status;
    private String coverUrl;
}
