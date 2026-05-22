package com.bookstore.dto.response;

import com.bookstore.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String address;
    private Boolean profileCompleted;
    private Role role;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
