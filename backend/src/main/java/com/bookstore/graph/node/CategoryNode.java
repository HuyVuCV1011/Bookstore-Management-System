package com.bookstore.graph.node;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Category")
@Data
public class CategoryNode {

    @Id
    private String categoryId;

    private String name;
    private String description;
    private Integer bookCount;
}
