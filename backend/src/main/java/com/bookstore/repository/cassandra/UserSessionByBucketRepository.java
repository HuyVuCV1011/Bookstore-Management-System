package com.bookstore.repository.cassandra;

import com.bookstore.entity.UserSessionByBucket;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSessionByBucketRepository extends CassandraRepository<UserSessionByBucket, String> {
    Slice<UserSessionByBucket> findByBucket(String bucket, Pageable pageable);
}
