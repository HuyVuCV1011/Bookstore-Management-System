package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CdcStatusResponse {
    private Boolean enabled;
    private Boolean mongoConnected;
    private LocalDateTime lastSyncTime;
    private Integer queueDepth;
    private String status; // "HEALTHY", "DEGRADED", "DOWN"
}
