package com.bookstore.service;

import com.bookstore.dto.response.AdminSystemHealthResponse;
import com.bookstore.dto.response.ProjectionStatusResponse;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.OutboxEventRepository;
import com.bookstore.repository.mongodb.BookDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSystemHealthService {

    private final JdbcTemplate jdbcTemplate;
    private final MongoTemplate mongoTemplate;
    private final StringRedisTemplate redisTemplate;
    private final CassandraTemplate cassandraTemplate;
    private final Neo4jClient neo4jClient;

    private final BookRepository bookRepository;
    private final BookDetailRepository bookDetailRepository;
    private final OutboxEventRepository outboxEventRepository;

    public AdminSystemHealthResponse getHealth() {
        String postgresStatus = checkPostgres();
        String mongoDbStatus = checkMongo();
        String redisStatus = checkRedis();
        String cassandraStatus = checkCassandra();
        String neo4jStatus = checkNeo4j();

        List<ProjectionStatusResponse> projections = new ArrayList<>();

        // PostgreSQL source count
        long sourceCount = 0;
        if ("UP".equals(postgresStatus)) {
            try {
                sourceCount = bookRepository.count();
            } catch (Exception e) {
                log.error("Failed to query Postgres book count", e);
            }
        }

        // Outbox stats
        long pendingOutbox = 0;
        long failedOutbox = 0;
        if ("UP".equals(postgresStatus)) {
            try {
                pendingOutbox = outboxEventRepository.countByStatus(OutboxStatus.PENDING);
                failedOutbox = outboxEventRepository.countByStatus(OutboxStatus.FAILED);
            } catch (Exception e) {
                log.error("Failed to query Outbox status", e);
            }
        }

        // MongoDB projection status
        long mongoSyncedCount = 0;
        if ("UP".equals(mongoDbStatus)) {
            try {
                mongoSyncedCount = bookDetailRepository.count();
            } catch (Exception e) {
                log.error("Failed to query Mongo synced count", e);
            }
        }

        String mongoProjStatus = "HEALTHY";
        if ("DOWN".equals(mongoDbStatus)) {
            mongoProjStatus = "DOWN";
        } else if (failedOutbox > 0) {
            mongoProjStatus = "DEGRADED";
        } else if (pendingOutbox > 10) {
            mongoProjStatus = "LAGGING";
        }

        projections.add(ProjectionStatusResponse.builder()
                .targetDatabase("MongoDB")
                .sourceCount(sourceCount)
                .syncedCount(mongoSyncedCount)
                .backlogDepth((int) pendingOutbox)
                .status(mongoProjStatus)
                .build());

        // Neo4j projection status
        long neo4jSyncedCount = 0;
        if ("UP".equals(neo4jStatus)) {
            try {
                neo4jSyncedCount = neo4jClient.query("MATCH (b:Book) RETURN count(b)")
                        .fetchAs(Long.class)
                        .one()
                        .orElse(0L);
            } catch (Exception e) {
                log.error("Failed to query Neo4j synced count", e);
            }
        }

        String neo4jProjStatus = "HEALTHY";
        if ("DOWN".equals(neo4jStatus)) {
            neo4jProjStatus = "DOWN";
        } else if (failedOutbox > 0) {
            neo4jProjStatus = "DEGRADED";
        } else if (pendingOutbox > 10) {
            neo4jProjStatus = "LAGGING";
        }

        projections.add(ProjectionStatusResponse.builder()
                .targetDatabase("Neo4j")
                .sourceCount(sourceCount)
                .syncedCount(neo4jSyncedCount)
                .backlogDepth((int) pendingOutbox)
                .status(neo4jProjStatus)
                .build());

        return AdminSystemHealthResponse.builder()
                .postgresStatus(postgresStatus)
                .mongoDbStatus(mongoDbStatus)
                .redisStatus(redisStatus)
                .cassandraStatus(cassandraStatus)
                .neo4jStatus(neo4jStatus)
                .projections(projections)
                .build();
    }

    private String checkPostgres() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return "UP";
        } catch (Exception e) {
            log.error("Postgres health check failed", e);
            return "DOWN";
        }
    }

    private String checkMongo() {
        try {
            mongoTemplate.getDb().getName();
            return "UP";
        } catch (Exception e) {
            log.error("MongoDB health check failed", e);
            return "DOWN";
        }
    }

    private String checkRedis() {
        try {
            redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<String>) conn -> {
                conn.ping();
                return "PONG";
            });
            return "UP";
        } catch (Exception e) {
            log.error("Redis health check failed", e);
            return "DOWN";
        }
    }

    private String checkCassandra() {
        try {
            cassandraTemplate.getCqlOperations().execute("SELECT release_version FROM system.local");
            return "UP";
        } catch (Exception e) {
            log.error("Cassandra health check failed", e);
            return "DOWN";
        }
    }

    private String checkNeo4j() {
        try {
            neo4jClient.query("MATCH (n) RETURN count(n) LIMIT 1").fetch().one();
            return "UP";
        } catch (Exception e) {
            log.error("Neo4j health check failed", e);
            return "DOWN";
        }
    }
}
