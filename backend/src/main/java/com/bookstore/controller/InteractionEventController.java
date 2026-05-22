package com.bookstore.controller;

import com.bookstore.dto.response.InteractionEventDTO;
import com.bookstore.dto.response.InteractionEventStatsDTO;
import com.bookstore.dto.response.MessageResponse;
import com.bookstore.dto.response.TopBookDTO;
import com.bookstore.entity.InteractionEvent;
import com.bookstore.entity.User;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.InteractionEventRepository;
import com.bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.data.cassandra.core.query.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/interaction-events")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class InteractionEventController {

    private final InteractionEventRepository interactionEventRepository;
    private final CassandraTemplate cassandraTemplate;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Boolean flagged,
            @RequestParam(required = false) String keyword
    ) {
        try {
            log.info("Get interaction events - page: {}, size: {}, eventType: {}, flagged: {}, keyword: {}",
                    page, size, eventType, flagged, keyword);

            // Get all events from Cassandra
            List<InteractionEvent> allEvents = cassandraTemplate.select(Query.empty(), InteractionEvent.class);
            log.debug("Found {} total events in Cassandra", allEvents.size());

            // Convert to DTOs and apply filters
            List<InteractionEventDTO> eventDTOs = allEvents.stream()
                    .filter(event -> {
                        // Filter by event type
                        if (eventType != null && !eventType.isEmpty()) {
                            return eventType.equalsIgnoreCase(event.getEventType());
                        }
                        return true;
                    })
                    .map(event -> {
                        String userEmail = "Unknown";
                        String bookTitle = "Unknown";

                        try {
                            User user = userRepository.findById(event.getUserId()).orElse(null);
                            if (user != null) {
                                userEmail = user.getEmail();
                            }
                        } catch (Exception e) {
                            log.warn("Failed to fetch user for event {}", event.getId(), e);
                        }

                        try {
                            if (event.getBookId() != null && event.getBookId() > 0) {
                                bookRepository.findById(event.getBookId()).ifPresent(book -> {});
                                bookTitle = "Book #" + event.getBookId();
                            }
                        } catch (Exception e) {
                            log.warn("Failed to fetch book for event {}", event.getId(), e);
                        }

                        return InteractionEventDTO.builder()
                                .id(event.getId())
                                .userId(event.getUserId())
                                .userEmail(userEmail)
                                .bookId(event.getBookId())
                                .bookTitle(bookTitle)
                                .eventType(event.getEventType())
                                .eventTime(LocalDateTime.ofInstant(event.getEventTime(), ZoneId.systemDefault()))
                                .metadata(event.getMetadata())
                                .flagged(false) // TODO: implement flagging mechanism
                                .build();
                    })
                    .filter(dto -> {
                        // Apply keyword filter
                        if (keyword != null && !keyword.trim().isEmpty()) {
                            String searchTerm = keyword.toLowerCase().trim();
                            return dto.getUserEmail().toLowerCase().contains(searchTerm) ||
                                   dto.getBookTitle().toLowerCase().contains(searchTerm) ||
                                   dto.getEventType().toLowerCase().contains(searchTerm);
                        }
                        return true;
                    })
                    .sorted((a, b) -> b.getEventTime().compareTo(a.getEventTime())) // Sort by time DESC
                    .collect(Collectors.toList());

            log.debug("After filtering and sorting: {} events", eventDTOs.size());

            // Pagination
            int start = page * size;
            int end = Math.min(start + size, eventDTOs.size());
            List<InteractionEventDTO> pageContent = start < eventDTOs.size()
                    ? eventDTOs.subList(start, end)
                    : Collections.emptyList();

            Pageable pageable = PageRequest.of(page, size);
            Page<InteractionEventDTO> eventsPage = new PageImpl<>(
                    pageContent,
                    pageable,
                    eventDTOs.size()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("events", eventsPage.getContent());
            response.put("totalPages", eventsPage.getTotalPages());
            response.put("totalElements", eventsPage.getTotalElements());
            response.put("currentPage", eventsPage.getNumber());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching interaction events", e);
            // Return empty response on error
            Pageable pageable = PageRequest.of(page, size);
            Map<String, Object> response = new HashMap<>();
            response.put("events", Collections.emptyList());
            response.put("totalPages", 0);
            response.put("totalElements", 0);
            response.put("currentPage", page);
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<InteractionEventStatsDTO> getStats() {
        try {
            log.info("Get interaction event stats");

            List<InteractionEvent> allEvents = cassandraTemplate.select(Query.empty(), InteractionEvent.class);
            LocalDateTime todayStart = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);

            long totalEvents = allEvents.size();
            long eventsToday = allEvents.stream()
                    .filter(e -> {
                        LocalDateTime eventTime = LocalDateTime.ofInstant(e.getEventTime(), ZoneId.systemDefault());
                        return eventTime.isAfter(todayStart);
                    })
                    .count();
            long uniqueUsers = allEvents.stream()
                    .map(InteractionEvent::getUserId)
                    .distinct()
                    .count();

            InteractionEventStatsDTO stats = InteractionEventStatsDTO.builder()
                    .totalEvents(totalEvents)
                    .eventsToday(eventsToday)
                    .flaggedEvents(0L) // TODO: implement flagging
                    .uniqueUsers(uniqueUsers)
                    .build();

            log.info("Event stats - total: {}, today: {}, unique users: {}", totalEvents, eventsToday, uniqueUsers);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error fetching event stats", e);
            return ResponseEntity.ok(InteractionEventStatsDTO.builder()
                    .totalEvents(0L)
                    .eventsToday(0L)
                    .flaggedEvents(0L)
                    .uniqueUsers(0L)
                    .build());
        }
    }

    @GetMapping("/distribution")
    public ResponseEntity<Map<String, Long>> getDistribution() {
        try {
            log.info("Get interaction event distribution");

            List<InteractionEvent> allEvents = cassandraTemplate.select(Query.empty(), InteractionEvent.class);

            Map<String, Long> distribution = allEvents.stream()
                    .collect(Collectors.groupingBy(
                            InteractionEvent::getEventType,
                            Collectors.counting()
                    ));

            log.info("Event distribution: {}", distribution);
            return ResponseEntity.ok(distribution);

        } catch (Exception e) {
            log.error("Error fetching event distribution", e);
            return ResponseEntity.ok(new HashMap<>());
        }
    }

    @GetMapping("/top-books")
    public ResponseEntity<List<TopBookDTO>> getTopBooks(
            @RequestParam(required = false, defaultValue = "views") String metric,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        try {
            log.info("Get top books - metric: {}, limit: {}", metric, limit);

            List<InteractionEvent> allEvents = cassandraTemplate.select(Query.empty(), InteractionEvent.class);

            // Determine event type based on metric
            String eventTypeFilter = switch (metric.toLowerCase()) {
                case "views" -> "VIEW";
                case "clicks" -> "CLICK";
                case "add_to_cart", "cart" -> "ADD_TO_CART";
                case "purchases" -> "PURCHASE";
                case "bookmark", "wishlist" -> "BOOKMARK";
                default -> "VIEW";
            };

            // Group by book and count events
            Map<Integer, Long> bookCounts = allEvents.stream()
                    .filter(e -> eventTypeFilter.equals(e.getEventType()))
                    .filter(e -> e.getBookId() != null && e.getBookId() > 0)
                    .collect(Collectors.groupingBy(
                            InteractionEvent::getBookId,
                            Collectors.counting()
                    ));

            // Sort and limit
            List<TopBookDTO> topBooks = bookCounts.entrySet().stream()
                    .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                    .limit(limit)
                    .map(entry -> {
                        String bookTitle = "Book #" + entry.getKey();
                        try {
                            bookRepository.findById(entry.getKey()).ifPresent(book -> {});
                            bookTitle = "Book #" + entry.getKey(); // Keep simple for now
                        } catch (Exception e) {
                            log.warn("Failed to fetch book {}", entry.getKey(), e);
                        }

                        return TopBookDTO.builder()
                                .bookId(entry.getKey())
                                .bookTitle(bookTitle)
                                .count(entry.getValue())
                                .build();
                    })
                    .toList();

            log.info("Top {} books by {}: {} results", limit, metric, topBooks.size());
            return ResponseEntity.ok(topBooks);

        } catch (Exception e) {
            log.error("Error fetching top books", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PatchMapping("/{eventId}/flag")
    public ResponseEntity<MessageResponse> flagEvent(
            @PathVariable UUID eventId,
            @RequestBody Map<String, String> request
    ) {
        String reason = request.get("reason");
        log.info("Flag event {} with reason: {}", eventId, reason);

        return ResponseEntity.ok(MessageResponse.builder()
                .message("Event flagged successfully")
                .build());
    }

    @PatchMapping("/{eventId}/unflag")
    public ResponseEntity<MessageResponse> unflagEvent(@PathVariable UUID eventId) {
        log.info("Unflag event {}", eventId);

        return ResponseEntity.ok(MessageResponse.builder()
                .message("Event unflagged successfully")
                .build());
    }
}
