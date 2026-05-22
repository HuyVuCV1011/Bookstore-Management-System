package com.bookstore.repository.mongodb;

import com.bookstore.entity.mongodb.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends MongoRepository<Review, String> {
    Page<Review> findByBookId(Integer bookId, Pageable pageable);
    Page<Review> findByBookIdAndRating(Integer bookId, Integer rating, Pageable pageable);
    Page<Review> findByBookIdAndModeratedTrue(Integer bookId, Pageable pageable);
    Page<Review> findByBookIdAndRatingAndModeratedTrue(Integer bookId, Integer rating, Pageable pageable);
    List<Review> findByBookIdAndModeratedTrue(Integer bookId);
    boolean existsByBookIdAndUserId(Integer bookId, UUID userId);
}
