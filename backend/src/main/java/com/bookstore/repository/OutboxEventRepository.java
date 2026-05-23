package com.bookstore.repository;

import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Integer> {

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = com.bookstore.entity.OutboxStatus.PENDING OR (e.status = com.bookstore.entity.OutboxStatus.FAILED AND e.attempts < :maxAttempts) ORDER BY e.createdAt ASC")
    List<OutboxEvent> findUnprocessedEvents(@Param("maxAttempts") int maxAttempts);

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);

    long countByStatus(OutboxStatus status);
}
