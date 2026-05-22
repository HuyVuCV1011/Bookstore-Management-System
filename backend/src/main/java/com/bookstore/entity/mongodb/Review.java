package com.bookstore.entity.mongodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Document(collection = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    private String id;
    private Integer bookId;
    private UUID userId;
    private String userName; // Denormalized for faster display
    private Integer rating; // 1-5
    private String comment;
    
    @Builder.Default
    private Boolean moderated = false;
    
    @CreatedDate
    private LocalDateTime createdAt;
}
