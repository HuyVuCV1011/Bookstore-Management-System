package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSystemHealthResponse {
    private String postgresStatus;
    private String mongoDbStatus;
    private String redisStatus;
    private String cassandraStatus;
    private String neo4jStatus;
    private List<ProjectionStatusResponse> projections;
}
