package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsOverviewResponse {
    private Long totalEvents;
    private Long eventsToday;
    private Long uniqueUsers;
    private Map<String, Long> eventTypeDistribution;
    private List<?> popularBooks;
    private Long urgentInventoryCount;
}
