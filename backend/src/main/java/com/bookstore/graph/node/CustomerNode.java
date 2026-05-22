package com.bookstore.graph.node;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Customer")
@Data
public class CustomerNode {

    @Id
    private String customerId;

    private String name;
    private String email;
    private String tier;            // bronze | silver | gold | platinum
    private Integer totalPurchases;
}
