package com.bookstore.repository.cassandra;

import com.bookstore.entity.InteractionEventByUser;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InteractionEventByUserRepository extends CassandraRepository<InteractionEventByUser, UUID> {
    long countByUserId(UUID userId);
    Slice<InteractionEventByUser> findByUserId(UUID userId, Pageable pageable);
}
