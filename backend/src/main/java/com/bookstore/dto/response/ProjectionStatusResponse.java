package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectionStatusResponse {
    private String targetDatabase;
    private long syncedCount;
    private long sourceCount;
    private int backlogDepth;
    private String status;
}
