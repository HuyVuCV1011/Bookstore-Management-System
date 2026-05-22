package com.bookstore.controller;

import com.bookstore.dto.request.CreateUserRequest;
import com.bookstore.dto.request.UpdateUserRequest;
import com.bookstore.dto.response.MessageResponse;
import com.bookstore.dto.response.UserResponse;
import com.bookstore.entity.Role;
import com.bookstore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse userResponse = userService.createUser(request);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User created successfully");
        response.put("user", userResponse);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String keyword
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> usersPage = userService.getAllUsers(pageable, role, keyword);

        Map<String, Object> response = new HashMap<>();
        response.put("users", usersPage.getContent());
        response.put("totalPages", usersPage.getTotalPages());
        response.put("totalElements", usersPage.getTotalElements());
        response.put("currentPage", usersPage.getNumber());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserResponse userResponse = userService.updateUser(id, request);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User updated successfully");
        response.put("user", userResponse);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);

        return ResponseEntity.ok(MessageResponse.builder()
                .message("User deactivated successfully")
                .build());
    }
}
