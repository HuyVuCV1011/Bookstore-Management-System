package com.bookstore.controller;

import com.bookstore.dto.request.WarehouseStaffRequest;
import com.bookstore.dto.response.PageResponse;
import com.bookstore.dto.response.WarehouseStaffResponse;
import com.bookstore.service.WarehouseStaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/warehouse-staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WarehouseStaffController {

    private final WarehouseStaffService warehouseStaffService;

    @PostMapping
    public ResponseEntity<WarehouseStaffResponse> create(@Valid @RequestBody WarehouseStaffRequest request) {
        WarehouseStaffResponse response = warehouseStaffService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<WarehouseStaffResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<WarehouseStaffResponse> result = warehouseStaffService.getAll(pageable, keyword);
        return ResponseEntity.ok(PageResponse.of(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseStaffResponse> getById(@PathVariable UUID id) {
        WarehouseStaffResponse response = warehouseStaffService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseStaffResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody WarehouseStaffRequest request
    ) {
        WarehouseStaffResponse response = warehouseStaffService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        warehouseStaffService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
