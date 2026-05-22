package com.bookstore.repository;

import com.bookstore.entity.SessionEntity;
import org.springframework.data.cassandra.repository.CassandraRepository;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends CassandraRepository<SessionEntity, UUID> {
    Optional<SessionEntity> findByRefreshToken(String refreshToken);
}
