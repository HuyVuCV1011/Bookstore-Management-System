package com.bookstore.controller;

import com.bookstore.dto.response.InteractionEventDTO;
import com.bookstore.dto.response.InteractionEventStatsDTO;
import com.bookstore.dto.response.MessageResponse;
import com.bookstore.dto.response.TopBookDTO;
import com.bookstore.entity.Book;
import com.bookstore.entity.InteractionEventByBucket;
import com.bookstore.entity.InteractionEventByType;
import com.bookstore.entity.User;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.UserRepository;
import com.bookstore.repository.cassandra.InteractionEventByBucketRepository;
import com.bookstore.repository.cassandra.InteractionEventByTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/interaction-events")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class InteractionEventController {

    private final InteractionEventByTypeRepository typeRepository;
    private final InteractionEventByBucketRepository bucketRepository;
    private final StringRedisTemplate redisTemplate;
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
            log.info("Get interaction events (optimized) - page: {}, size: {}, eventType: {}, flagged: {}, keyword: {}",
                    page, size, eventType, flagged, keyword);

            Pageable pageable = PageRequest.of(page, size);
            List<InteractionEventDTO> eventDTOs = new ArrayList<>();
            boolean hasNext = false;

            if (eventType != null && !eventType.isBlank()) {
                Slice<InteractionEventByType> slice = typeRepository.findByEventType(eventType, pageable);
                hasNext = slice.hasNext();
                List<InteractionEventByType> content = slice.getContent();

                // Batch load users & books
                Set<UUID> userIds = content.stream().map(InteractionEventByType::getUserId).filter(Objects::nonNull).collect(Collectors.toSet());
                Set<Integer> bookIds = content.stream().map(InteractionEventByType::getBookId).filter(id -> id != null && id > 0).collect(Collectors.toSet());

                Map<UUID, User> userMap = userRepository.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));
                Map<Integer, Book> bookMap = bookRepository.findAllById(bookIds).stream().collect(Collectors.toMap(Book::getId, b -> b));

                for (InteractionEventByType event : content) {
                    User user = userMap.get(event.getUserId());
                    String userEmail = user != null ? user.getEmail() : "Unknown";

                    Book book = bookMap.get(event.getBookId());
                    String bookTitle = book != null ? book.getTitle() : ("Book #" + event.getBookId());

                    eventDTOs.add(InteractionEventDTO.builder()
                            .id(event.getId())
                            .userId(event.getUserId())
                            .userEmail(userEmail)
                            .bookId(event.getBookId())
                            .bookTitle(bookTitle)
                            .eventType(event.getEventType())
                            .eventTime(LocalDateTime.ofInstant(event.getEventTime(), ZoneId.systemDefault()))
                            .metadata(event.getMetadata())
                            .flagged(false)
                            .build());
                }
            } else {
                Slice<InteractionEventByBucket> slice = bucketRepository.findByBucket("all", pageable);
                hasNext = slice.hasNext();
                List<InteractionEventByBucket> content = slice.getContent();

                // Batch load users & books
                Set<UUID> userIds = content.stream().map(InteractionEventByBucket::getUserId).filter(Objects::nonNull).collect(Collectors.toSet());
                Set<Integer> bookIds = content.stream().map(InteractionEventByBucket::getBookId).filter(id -> id != null && id > 0).collect(Collectors.toSet());

                Map<UUID, User> userMap = userRepository.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));
                Map<Integer, Book> bookMap = bookRepository.findAllById(bookIds).stream().collect(Collectors.toMap(Book::getId, b -> b));

                for (InteractionEventByBucket event : content) {
                    User user = userMap.get(event.getUserId());
                    String userEmail = user != null ? user.getEmail() : "Unknown";

                    Book book = bookMap.get(event.getBookId());
                    String bookTitle = book != null ? book.getTitle() : ("Book #" + event.getBookId());

                    eventDTOs.add(InteractionEventDTO.builder()
                            .id(event.getId())
                            .userId(event.getUserId())
                            .userEmail(userEmail)
                            .bookId(event.getBookId())
                            .bookTitle(bookTitle)
                            .eventType(event.getEventType())
                            .eventTime(LocalDateTime.ofInstant(event.getEventTime(), ZoneId.systemDefault()))
                            .metadata(event.getMetadata())
                            .flagged(false)
                            .build());
                }
            }

            // Apply keyword filter in memory if provided
            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchTerm = keyword.toLowerCase().trim();
                eventDTOs = eventDTOs.stream()
                        .filter(dto -> dto.getUserEmail().toLowerCase().contains(searchTerm) ||
                                       dto.getBookTitle().toLowerCase().contains(searchTerm) ||
                                       dto.getEventType().toLowerCase().contains(searchTerm))
                        .collect(Collectors.toList());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("events", eventDTOs);
            response.put("totalPages", hasNext ? page + 2 : page + 1);
            response.put("totalElements", (long) (page * size) + eventDTOs.size() + (hasNext ? size : 0));
            response.put("currentPage", page);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching interaction events", e);
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
            log.info("Get interaction event stats (from Redis)");

            String totalStr = redisTemplate.opsForValue().get("stats:events:total");
            long totalEvents = totalStr != null ? Long.parseLong(totalStr) : 0L;

            String todayStr = LocalDate.now().toString();
            String todayCountStr = redisTemplate.opsForValue().get("stats:events:today:" + todayStr);
            long eventsToday = todayCountStr != null ? Long.parseLong(todayCountStr) : 0L;

            Long uniqueUsers = redisTemplate.opsForSet().size("stats:events:unique_users");
            if (uniqueUsers == null) {
                uniqueUsers = 0L;
            }

            InteractionEventStatsDTO stats = InteractionEventStatsDTO.builder()
                    .totalEvents(totalEvents)
                    .eventsToday(eventsToday)
                    .flaggedEvents(0L)
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
            log.info("Get interaction event distribution (from Redis)");

            Map<Object, Object> rawDist = redisTemplate.opsForHash().entries("stats:events:distribution");
            Map<String, Long> distribution = new HashMap<>();

            for (Map.Entry<Object, Object> entry : rawDist.entrySet()) {
                distribution.put(entry.getKey().toString(), Long.parseLong(entry.getValue().toString()));
            }

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
            log.info("Get top books (from Redis) - metric: {}, limit: {}", metric, limit);

            String redisMetric = switch (metric.toLowerCase()) {
                case "views" -> "views";
                case "clicks" -> "clicks";
                case "add_to_cart", "cart" -> "cart";
                case "purchases" -> "purchases";
                case "bookmark", "wishlist" -> "wishlist";
                default -> "views";
            };

            Set<TypedTuple<String>> topBookTuples = redisTemplate.opsForZSet()
                    .reverseRangeWithScores("stats:books:" + redisMetric, 0, limit - 1);

            if (topBookTuples == null || topBookTuples.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Extract book IDs
            List<Integer> bookIds = topBookTuples.stream()
                    .map(t -> Integer.parseInt(t.getValue()))
                    .toList();

            // Batch fetch book details to enrich titles
            Map<Integer, Book> bookMap = bookRepository.findAllById(bookIds).stream()
                    .collect(Collectors.toMap(Book::getId, b -> b));

            List<TopBookDTO> topBooks = new ArrayList<>();
            for (TypedTuple<String> tuple : topBookTuples) {
                int bookId = Integer.parseInt(tuple.getValue());
                double score = tuple.getScore() != null ? tuple.getScore() : 0.0;

                Book book = bookMap.get(bookId);
                String bookTitle = book != null ? book.getTitle() : ("Book #" + bookId);

                topBooks.add(TopBookDTO.builder()
                        .bookId(bookId)
                        .bookTitle(bookTitle)
                        .count((long) score)
                        .build());
            }

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
