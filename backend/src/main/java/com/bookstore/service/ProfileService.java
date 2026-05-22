package com.bookstore.service;

import com.bookstore.dto.request.UpdateProfileRequest;
import com.bookstore.dto.response.ProfileResponse;
import com.bookstore.entity.Customer;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final CustomerRepository customerRepository;

    public ProfileResponse getProfile(UUID userId) {
        log.debug("Fetching profile for userId: {}", userId);

        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));

        return ProfileResponse.builder()
            .fullName(customer.getFullName())
            .phoneNumber(customer.getPhoneNumber())
            .address(customer.getAddress())
            .email(customer.getEmail())
            .profileCompleted(customer.isProfileCompleted())
            .registrationDate(customer.getRegistrationDate())
            .build();
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        log.debug("Updating profile for userId: {}", userId);

        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));

        customer.setFullName(request.getFullName());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setAddress(request.getAddress());
        customer.setProfileCompleted(true);

        Customer updated = customerRepository.save(customer);
        log.info("Profile updated and marked complete for userId: {}", userId);

        return ProfileResponse.builder()
            .fullName(updated.getFullName())
            .phoneNumber(updated.getPhoneNumber())
            .address(updated.getAddress())
            .email(updated.getEmail())
            .profileCompleted(updated.isProfileCompleted())
            .registrationDate(updated.getRegistrationDate())
            .build();
    }
}
