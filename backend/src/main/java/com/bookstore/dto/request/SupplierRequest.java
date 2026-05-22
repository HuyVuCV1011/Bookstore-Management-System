package com.bookstore.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRequest {

    @NotBlank(message = "Supplier name is required")
    @Size(max = 255, message = "Supplier name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Contact person must not exceed 255 characters")
    private String contactPerson;

    @NotBlank(message = "Phone is required")
    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private String address;

    private String paymentTerms;
}
