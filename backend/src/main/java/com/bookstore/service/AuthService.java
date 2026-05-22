package com.bookstore.service;

import com.bookstore.dto.request.LoginRequest;
import com.bookstore.dto.request.RegisterRequest;
import com.bookstore.dto.response.LoginResponse;
import com.bookstore.dto.response.TokenResponse;
import com.bookstore.dto.response.UserResponse;
import com.bookstore.entity.Customer;
import com.bookstore.entity.RefreshToken;
import com.bookstore.entity.Role;
import com.bookstore.entity.SessionEntity;
import com.bookstore.entity.User;
import com.bookstore.event.CustomerGraphProjectionAction;
import com.bookstore.event.CustomerGraphProjectionEvent;
import com.bookstore.repository.CustomerRepository;
import com.bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final SessionService sessionService;
    private final UserService userService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        log.debug("Starting registration process for email: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Registration failed: Email already exists: {}", request.getEmail());
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        log.debug("User created - userId: {}, email: {}", savedUser.getId(), savedUser.getEmail());

        // Create customer profile record with optional fields
        boolean hasFullName = request.getFullName() != null && !request.getFullName().isBlank();
        boolean hasPhone = request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank();
        boolean hasAddress = request.getAddress() != null && !request.getAddress().isBlank();
        boolean profileCompleted = hasFullName && hasPhone && hasAddress;

        Customer customer = Customer.builder()
                .user(savedUser)
                .email(savedUser.getEmail())
                .fullName(hasFullName ? request.getFullName() : null)
                .phoneNumber(hasPhone ? request.getPhoneNumber() : null)
                .address(hasAddress ? request.getAddress() : null)
                .profileCompleted(profileCompleted)
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        log.debug("Customer profile created - customerId: {}, userId: {}, profileCompleted: {}",
                savedCustomer.getId(), savedUser.getId(), profileCompleted);

        publishCustomerGraphProjection(savedUser, CustomerGraphProjectionAction.UPSERT);
        log.info("User registered successfully - userId: {}, customerId: {}, email: {}",
                savedUser.getId(), savedCustomer.getId(), savedUser.getEmail());

        return buildUserResponse(savedUser, savedCustomer);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.debug("Attempting login for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found - email: {}", request.getEmail());
                    return new BadCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed: Invalid password - email: {}, userId: {}", request.getEmail(), user.getId());
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            log.warn("Login failed: Account deactivated - email: {}, userId: {}", request.getEmail(), user.getId());
            throw new BadCredentialsException("Account has been deactivated. Contact admin.");
        }

        log.debug("Generating tokens for user: {}", user.getId());

        // Create session in Cassandra first
        SessionEntity session = null;
        try {
            String deviceInfo = request.getDeviceInfo() != null ? request.getDeviceInfo() : "Unknown Device";
            String ipAddress = request.getIpAddress() != null ? request.getIpAddress() : "Unknown IP";
            session = sessionService.createSession(user, request.isRememberMe(), deviceInfo, ipAddress);
            log.debug("Session created in Cassandra for userId: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to create Cassandra session for userId: {}", user.getId(), e);
            // Don't fail login if Cassandra write fails
        }

        // Generate tokens with sessionId
        String accessToken = session != null
            ? jwtService.generateAccessToken(user, session.getSessionId())
            : jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, request.isRememberMe());

        log.info("Login successful - userId: {}, email: {}, rememberMe: {}", user.getId(), user.getEmail(), request.isRememberMe());

        // Load customer profile if user is a customer
        Customer customer = null;
        if (user.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(user.getId()).orElse(null);
        }

        UserResponse userResponse = buildUserResponse(user, customer);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(userResponse)
                .build();
    }

    public TokenResponse refreshAccessToken(String refreshTokenString) {
        log.debug("Refreshing access token");
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenString);
        User user = refreshToken.getUser();

        String accessToken = jwtService.generateAccessToken(user);
        log.info("Access token refreshed successfully for userId: {}", user.getId());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null) {
            log.debug("Processing logout with refresh token");
            refreshTokenService.deleteByToken(refreshToken);
            log.info("Logout successful - refresh token deleted");
        } else {
            log.debug("Logout called without refresh token");
        }
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

    public UserResponse getCurrentUser(UUID userId) {
        log.debug("Fetching current user for userId: {}", userId);
        User user = userService.findById(userId);
        log.debug("Current user fetched successfully: {}", user.getEmail());

        // Load customer profile if user is a customer
        Customer customer = null;
        if (user.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(user.getId()).orElse(null);
        }

        return buildUserResponse(user, customer);
    }

    private UserResponse buildUserResponse(User user, Customer customer) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt());

        // Add customer profile fields if available
        if (customer != null) {
            builder.fullName(customer.getFullName())
                    .phoneNumber(customer.getPhoneNumber())
                    .address(customer.getAddress())
                    .profileCompleted(customer.isProfileCompleted());
        } else {
            builder.fullName(null)
                    .phoneNumber(null)
                    .address(null)
                    .profileCompleted(false);
        }

        return builder.build();
    }
}
