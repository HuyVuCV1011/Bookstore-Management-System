package com.bookstore.service;

import com.bookstore.dto.request.CustomerRequest;
import com.bookstore.dto.response.CustomerResponse;
import com.bookstore.entity.Customer;
import com.bookstore.entity.Role;
import com.bookstore.entity.User;
import com.bookstore.event.CustomerGraphProjectionAction;
import com.bookstore.event.CustomerGraphProjectionEvent;
import com.bookstore.exception.DuplicateResourceException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.repository.CustomerRepository;
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
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAll(Pageable pageable, String keyword) {
        Page<Customer> customers;
        if (keyword != null && !keyword.isBlank()) {
            customers = customerRepository.searchActive(keyword.trim(), pageable);
        } else {
            customers = customerRepository.findAllActive(pageable);
        }
        return customers.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getById(UUID id) {
        Customer customer = customerRepository.findActiveByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with user id: " + id));
        return toResponse(customer);
    }

    public CustomerResponse create(CustomerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        // Create user first
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();
        User savedUser = userRepository.save(user);

        // Create customer profile
        Customer customer = Customer.builder()
                .user(savedUser)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .profileCompleted(true)
                .build();
        Customer savedCustomer = customerRepository.save(customer);

        publishCustomerGraphProjection(savedUser, CustomerGraphProjectionAction.UPSERT);
        return toResponse(savedCustomer);
    }

    public CustomerResponse update(UUID id, CustomerRequest request) {
        Customer customer = customerRepository.findActiveByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with user id: " + id));
        User user = customer.getUser();

        // Check email uniqueness if changed
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        // Update user email and password if provided
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        userRepository.save(user);

        // Update customer profile
        customer.setEmail(request.getEmail());
        customer.setFullName(request.getFullName());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setAddress(request.getAddress());
        Customer updated = customerRepository.save(customer);

        publishCustomerGraphProjection(user, CustomerGraphProjectionAction.UPSERT);
        return toResponse(updated);
    }

    public CustomerResponse toggleStatus(UUID id) {
        Customer customer = customerRepository.findActiveByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with user id: " + id));
        User user = customer.getUser();

        user.setIsActive(!user.getIsActive());
        userRepository.save(user);

        publishCustomerGraphProjection(user, CustomerGraphProjectionAction.UPSERT);
        return toResponse(customer);
    }

    public void delete(UUID id) {
        Customer customer = customerRepository.findActiveByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with user id: " + id));
        User user = customer.getUser();

        publishCustomerGraphProjection(user, CustomerGraphProjectionAction.DEACTIVATE);
        customerRepository.delete(customer);
        userRepository.delete(user);
    }

    private CustomerResponse toResponse(Customer customer) {
        System.out.println("[CustomerService] Converting customer: " + customer.getId());
        System.out.println("[CustomerService] Full name: " + customer.getFullName());
        System.out.println("[CustomerService] Phone: " + customer.getPhoneNumber());

        return CustomerResponse.builder()
                .id(customer.getUser().getId().toString())
                .email(customer.getEmail())
                .fullName(customer.getFullName())
                .phoneNumber(customer.getPhoneNumber())
                .address(customer.getAddress())
                .isActive(customer.getUser().getIsActive())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    private void publishCustomerGraphProjection(User user, CustomerGraphProjectionAction action) {
        eventPublisher.publishEvent(new CustomerGraphProjectionEvent(
                user.getId(),
                user.getEmail(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive(),
                action
        ));
    }
}
