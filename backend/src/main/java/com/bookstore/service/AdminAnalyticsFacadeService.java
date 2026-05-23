package com.bookstore.service;

import com.bookstore.dto.response.AdminAnalyticsOverviewResponse;
import com.bookstore.entity.PopularBook;
import com.bookstore.repository.InventoryReorderRepository;
import com.bookstore.repository.PopularBookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAnalyticsFacadeService {

    private final StringRedisTemplate redisTemplate;
    private final PopularBookRepository popularBookRepository;
    private final InventoryReorderRepository inventoryReorderRepository;

    public AdminAnalyticsOverviewResponse getOverview() {
        // 1. Total events count from Redis
        String totalEventsStr = redisTemplate.opsForValue().get("stats:events:total");
        long totalEvents = totalEventsStr != null ? Long.parseLong(totalEventsStr) : 0L;

        // 2. Today's events count from Redis
        String todayStr = LocalDate.now().toString();
        String eventsTodayStr = redisTemplate.opsForValue().get("stats:events:today:" + todayStr);
        long eventsToday = eventsTodayStr != null ? Long.parseLong(eventsTodayStr) : 0L;

        // 3. Unique users count from Redis
        Long uniqueUsers = redisTemplate.opsForSet().size("stats:events:unique_users");
        if (uniqueUsers == null) {
            uniqueUsers = 0L;
        }

        // 4. Distribution map from Redis hash
        Map<Object, Object> rawDist = redisTemplate.opsForHash().entries("stats:events:distribution");
        Map<String, Long> distribution = new HashMap<>();
        for (Map.Entry<Object, Object> entry : rawDist.entrySet()) {
            try {
                distribution.put(entry.getKey().toString(), Long.parseLong(entry.getValue().toString()));
            } catch (Exception e) {
                // Ignore conversion errors
            }
        }

        // 5. Popular books list
        List<PopularBook> popularBooks = popularBookRepository.findAll();

        // 6. Urgent inventory reorder count
        long urgentInventoryCount = 0;
        try {
            urgentInventoryCount = inventoryReorderRepository.findByReorderPriorityIn(List.of("URGENT", "HIGH")).size();
        } catch (Exception e) {
            log.error("Failed to query urgent inventory count", e);
        }

        return AdminAnalyticsOverviewResponse.builder()
                .totalEvents(totalEvents)
                .eventsToday(eventsToday)
                .uniqueUsers(uniqueUsers)
                .eventTypeDistribution(distribution)
                .popularBooks(popularBooks)
                .urgentInventoryCount(urgentInventoryCount)
                .build();
    }
}
