package com.bookstore.repository.cassandra;

import com.bookstore.entity.InteractionEventByType;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface InteractionEventByTypeRepository extends CassandraRepository<InteractionEventByType, String> {
    Slice<InteractionEventByType> findByEventType(String eventType, Pageable pageable);
}
