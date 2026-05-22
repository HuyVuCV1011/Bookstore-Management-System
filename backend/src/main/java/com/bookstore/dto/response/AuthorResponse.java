package com.bookstore.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorResponse {
    private Integer id;
    private String name;
    private String biography;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
