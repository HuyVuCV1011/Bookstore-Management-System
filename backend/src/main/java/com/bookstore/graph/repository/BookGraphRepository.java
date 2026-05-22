package com.bookstore.graph.repository;

import com.bookstore.graph.node.BookNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookGraphRepository extends Neo4jRepository<BookNode, String> {
    Optional<BookNode> findByIsbn(String isbn);
}
