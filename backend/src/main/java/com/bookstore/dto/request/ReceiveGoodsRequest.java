package com.bookstore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiveGoodsRequest {

    @NotNull(message = "Items are required")
    @NotEmpty(message = "At least one item must be received")
    @Valid
    private List<ReceiveItemRequest> items;
}
