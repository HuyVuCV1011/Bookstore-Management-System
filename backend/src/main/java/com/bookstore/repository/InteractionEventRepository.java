package com.bookstore.repository;

import com.bookstore.entity.InteractionEvent;
import org.springframework.data.cassandra.repository.CassandraRepository;

import java.util.UUID;

public interface InteractionEventRepository extends CassandraRepository<InteractionEvent, UUID> {
}
