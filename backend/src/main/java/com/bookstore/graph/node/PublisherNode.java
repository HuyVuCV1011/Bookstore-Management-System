package com.bookstore.graph.node;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Publisher")
@Data
public class PublisherNode {

    @Id
    private String publisherId;

    private String name;
    private String country;
}
