package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionEventStatsDTO {
    private Long totalEvents;
    private Long eventsToday;
    private Long flaggedEvents;
    private Long uniqueUsers;
}
