package com.bookstore.service;

import com.bookstore.dto.request.WarehouseStaffRequest;
import com.bookstore.dto.response.WarehouseStaffResponse;
import com.bookstore.entity.*;
import com.bookstore.exception.DuplicateResourceException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.UserRepository;
import com.bookstore.repository.WarehouseStaffRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WarehouseStaffService {

    private final WarehouseStaffRepository warehouseStaffRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    public WarehouseStaffResponse create(WarehouseStaffRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("User with email '" + request.getEmail() + "' already exists");
        }

        // Create User account
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STAFF)
                .isActive(true)
                .build();
        User savedUser = userRepository.save(user);
        entityManager.flush(); // Ensure user ID is generated

        // Create WarehouseStaff record
        WarehouseStaff warehouseStaff = WarehouseStaff.builder()
                .user(savedUser)
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .areaResponsible(request.getAreaResponsible())
                .hireDate(LocalDate.now())
                .build();
        WarehouseStaff savedWarehouseStaff = warehouseStaffRepository.save(warehouseStaff);
        entityManager.flush(); // Ensure @MapsId generates the ID

        return toResponse(savedWarehouseStaff);
    }

    @Transactional(readOnly = true)
    public Page<WarehouseStaffResponse> getAll(Pageable pageable, String keyword) {
        Page<WarehouseStaff> staffPage;

        if (keyword != null && !keyword.trim().isEmpty()) {
            staffPage = warehouseStaffRepository.searchByKeyword(keyword, pageable);
        } else {
            staffPage = warehouseStaffRepository.findAll(pageable);
        }

        return staffPage.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public WarehouseStaffResponse getById(UUID id) {
        WarehouseStaff warehouseStaff = warehouseStaffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse staff not found with id: " + id));

        return toResponse(warehouseStaff);
    }

    public WarehouseStaffResponse update(UUID id, WarehouseStaffRequest request) {
        WarehouseStaff warehouseStaff = warehouseStaffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse staff not found with id: " + id));

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Check email uniqueness if changed
        if (!warehouseStaff.getEmail().equals(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new DuplicateResourceException("User with email '" + request.getEmail() + "' already exists");
            }
            user.setEmail(request.getEmail());
            warehouseStaff.setEmail(request.getEmail());
        }

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Update warehouse staff details
        warehouseStaff.setFullName(request.getFullName());
        warehouseStaff.setPhoneNumber(request.getPhoneNumber());
        warehouseStaff.setAreaResponsible(request.getAreaResponsible());

        userRepository.save(user);
        warehouseStaffRepository.save(warehouseStaff);

        return toResponse(warehouseStaff);
    }

    public void delete(UUID id) {
        WarehouseStaff warehouseStaff = warehouseStaffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse staff not found with id: " + id));

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Soft delete
        warehouseStaff.setDeletedAt(LocalDateTime.now());
        user.setIsActive(false);

        warehouseStaffRepository.save(warehouseStaff);
        userRepository.save(user);
    }

    private WarehouseStaffResponse toResponse(WarehouseStaff warehouseStaff) {
        return WarehouseStaffResponse.builder()
                .id(warehouseStaff.getId())
                .fullName(warehouseStaff.getFullName())
                .email(warehouseStaff.getEmail())
                .phoneNumber(warehouseStaff.getPhoneNumber())
                .areaResponsible(warehouseStaff.getAreaResponsible())
                .hireDate(warehouseStaff.getHireDate())
                .isActive(warehouseStaff.getUser().getIsActive())
                .createdAt(warehouseStaff.getCreatedAt())
                .updatedAt(warehouseStaff.getUpdatedAt())
                .build();
    }
}
