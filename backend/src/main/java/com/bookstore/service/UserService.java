package com.bookstore.service;

import com.bookstore.dto.request.CreateUserRequest;
import com.bookstore.dto.request.UpdateUserRequest;
import com.bookstore.dto.response.UserResponse;
import com.bookstore.entity.Role;
import com.bookstore.entity.User;
import com.bookstore.event.CustomerGraphProjectionAction;
import com.bookstore.event.CustomerGraphProjectionEvent;
import com.bookstore.exception.UserNotFoundException;
import com.bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        publishCustomerGraphProjection(savedUser, CustomerGraphProjectionAction.UPSERT);
        return mapToUserResponse(savedUser);
    }

    public Page<UserResponse> getAllUsers(Pageable pageable, Role roleFilter, String keyword) {
        Page<User> users;
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        String normalizedKeyword = hasKeyword ? keyword.trim() : null;

        if (hasKeyword && roleFilter != null) {
            users = userRepository.searchByRoleAndKeyword(roleFilter, normalizedKeyword, pageable);
        } else if (hasKeyword) {
            users = userRepository.searchByKeyword(normalizedKeyword, pageable);
        } else if (roleFilter != null) {
            users = userRepository.findByRole(roleFilter, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::mapToUserResponse);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        User updatedUser = userRepository.save(user);
        publishCustomerGraphProjection(updatedUser, CustomerGraphProjectionAction.UPSERT);
        return mapToUserResponse(updatedUser);
    }

    @Transactional
    public void deactivateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);
        publishCustomerGraphProjection(user, CustomerGraphProjectionAction.DEACTIVATE);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private void publishCustomerGraphProjection(User user, CustomerGraphProjectionAction action) {
        eventPublisher.publishEvent(new CustomerGraphProjectionEvent(
                user.getId(),
                user.getEmail(),
                user.getEmail(),  // Use email as display name fallback
                user.getRole(),
                user.getIsActive(),
                action
        ));
    }
}
