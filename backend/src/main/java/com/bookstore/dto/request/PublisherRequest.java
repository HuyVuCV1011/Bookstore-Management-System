package com.bookstore.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PublisherRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    private String address;

    @Size(max = 50)
    private String phone;

    @Email(message = "Email should be valid")
    private String email;
}
