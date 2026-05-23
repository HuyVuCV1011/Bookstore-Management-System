package com.bookstore.repository.mongodb;

import com.bookstore.entity.mongodb.Review;
import com.bookstore.dto.response.RatingAggregationResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
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

    @Aggregation(pipeline = {
        "{ '$match': { 'bookId': { '$in': ?0 }, 'moderated': true } }",
        "{ '$group': { '_id': { 'bookId': '$bookId', 'rating': '$rating' }, 'count': { '$sum': 1 } } }",
        "{ '$project': { 'bookId': '$_id.bookId', 'rating': '$_id.rating', 'count': 1, '_id': 0 } }"
    })
    List<RatingAggregationResult> aggregateRatings(List<Integer> bookIds);
}
