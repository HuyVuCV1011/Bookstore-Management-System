package com.bookstore.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AuthorRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    private String biography;
}
