package com.bookstore.controller;

import com.bookstore.dto.request.PublisherRequest;
import com.bookstore.dto.response.*;
import com.bookstore.service.PublisherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publishers")
@RequiredArgsConstructor
public class PublisherController {
    private final PublisherService publisherService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PublisherResponse> create(@Valid @RequestBody PublisherRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(publisherService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublisherResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(publisherService.getById(id));
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword
    ) {
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<PublisherResponse> result = publisherService.getAll(pageable, keyword);
            return ResponseEntity.ok(PageResponse.of(result));
        }
        return ResponseEntity.ok(publisherService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PublisherResponse> update(@PathVariable Integer id, @Valid @RequestBody PublisherRequest request) {
        return ResponseEntity.ok(publisherService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        publisherService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
