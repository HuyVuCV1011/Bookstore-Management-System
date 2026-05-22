package com.bookstore.graph.repository;

import com.bookstore.graph.node.CustomerNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerGraphRepository extends Neo4jRepository<CustomerNode, String> {
    Optional<CustomerNode> findByCustomerId(String customerId);
}
