package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private String fullName;
    private String phoneNumber;
    private String address;
    private String email;
    private boolean profileCompleted;
    private LocalDate registrationDate;
}
