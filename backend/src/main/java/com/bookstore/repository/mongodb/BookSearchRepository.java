package com.bookstore.repository.mongodb;

import com.bookstore.entity.mongodb.BookSearch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface BookSearchRepository extends MongoRepository<BookSearch, Integer> {
    
    @Query("{'$and': [{'businessStatus': 'ACTIVE'}, {'$text': {'$search': ?0}}]}")
    Page<BookSearch> searchByText(String keyword, Pageable pageable);

    Page<BookSearch> findByCategoryNameAndBusinessStatus(String categoryName, String businessStatus, Pageable pageable);

    Page<BookSearch> findByPriceBetweenAndBusinessStatus(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String businessStatus, Pageable pageable);

    Page<BookSearch> findByBusinessStatus(String businessStatus, Pageable pageable);
}
