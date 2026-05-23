package com.bookstore.repository.cassandra;

import com.bookstore.entity.SessionEntity;
import org.springframework.data.cassandra.repository.CassandraRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends CassandraRepository<SessionEntity, UUID> {
    Optional<SessionEntity> findByRefreshToken(String refreshToken);
    List<SessionEntity> findByUserId(UUID userId);
}
