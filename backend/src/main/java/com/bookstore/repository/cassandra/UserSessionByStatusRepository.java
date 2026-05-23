package com.bookstore.repository.cassandra;

import com.bookstore.entity.UserSessionByStatus;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSessionByStatusRepository extends CassandraRepository<UserSessionByStatus, String> {
    long countByStatus(String status);
}
