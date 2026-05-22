package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingSummaryResponse {
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingDistribution; // e.g., {5: 10, 4: 5, ...}
}
