package com.bookstore.controller.admin;

import com.bookstore.dto.response.CdcStatusResponse;
import com.bookstore.dto.response.CdcStatsResponse;
import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.service.CdcAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cdc")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class CdcAdminController {

    private final CdcAdminService cdcAdminService;

    @GetMapping("/status")
    public ResponseEntity<CdcStatusResponse> getStatus() {
        return ResponseEntity.ok(cdcAdminService.getStatus());
    }

    @GetMapping("/stats")
    public ResponseEntity<CdcStatsResponse> getStats() {
        return ResponseEntity.ok(cdcAdminService.getStats());
    }

    @PostMapping("/sync-book/{id}")
    public ResponseEntity<String> syncBook(@PathVariable Integer id) {
        cdcAdminService.syncSingleBook(id);
        return ResponseEntity.ok("Sync initiated for book " + id);
    }

    @PostMapping("/sync-all-books")
    public ResponseEntity<String> syncAllBooks() {
        cdcAdminService.syncAllBooks();
        return ResponseEntity.ok("Full resync initiated");
    }

    @GetMapping("/check-consistency")
    public ResponseEntity<CdcStatsResponse> checkConsistency() {
        return ResponseEntity.ok(cdcAdminService.checkConsistency());
    }

    @GetMapping("/outbox")
    public ResponseEntity<List<OutboxEvent>> getOutboxEvents(@RequestParam(required = false) OutboxStatus status) {
        return ResponseEntity.ok(cdcAdminService.getOutboxEvents(status));
    }

    @PostMapping("/outbox/retry/{id}")
    public ResponseEntity<String> retryEvent(@PathVariable Integer id) {
        cdcAdminService.retryOutboxEvent(id);
        return ResponseEntity.ok("Retry completed for outbox event " + id);
    }

    @PostMapping("/outbox/retry-failed")
    public ResponseEntity<String> retryFailedEvents() {
        cdcAdminService.retryAllFailedOutboxEvents();
        return ResponseEntity.ok("All failed outbox events reset to PENDING");
    }
}
