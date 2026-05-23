package com.bookstore.repository.cassandra;

import com.bookstore.entity.InteractionEventByBucket;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface InteractionEventByBucketRepository extends CassandraRepository<InteractionEventByBucket, String> {
    Slice<InteractionEventByBucket> findByBucket(String bucket, Pageable pageable);
}
