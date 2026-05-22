package com.bookstore.dto.response;

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
public class SessionWithUserDTO {

    private String sessionId;
    private UUID userId;
    private String userEmail;
    private String deviceInfo;
    private String ipAddress;
    private Boolean revoked;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
