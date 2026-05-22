package com.bookstore.graph.node;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Author")
@Data
public class AuthorNode {

    @Id
    private String authorId;

    private String name;
    private String nationality;
    private Integer birthYear;
    private String bio;
    private Integer bookCount;
}
