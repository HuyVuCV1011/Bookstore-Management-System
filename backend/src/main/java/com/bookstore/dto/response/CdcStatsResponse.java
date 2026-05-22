package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CdcStatsResponse {
    private Long totalBooksPostgres;
    private Long totalBooksMongo;
    private Long syncSuccessCount;
    private Long syncFailureCount;
    private Double successRate;
    private Double avgSyncDurationMs;
}
