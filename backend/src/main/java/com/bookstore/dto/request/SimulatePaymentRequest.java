package com.bookstore.dto.request;

import com.bookstore.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatePaymentRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String accountNumber;
    private String cvv;
    private String otp;

    @Builder.Default
    private boolean simulateFailure = false;
}
