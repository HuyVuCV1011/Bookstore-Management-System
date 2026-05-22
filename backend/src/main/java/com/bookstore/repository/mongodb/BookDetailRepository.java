package com.bookstore.repository.mongodb;

import com.bookstore.entity.mongodb.BookDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface BookDetailRepository extends MongoRepository<BookDetail, Integer> {

    @Query("{$text: {$search: ?0}}")
    Page<BookDetail> searchByText(String keyword, Pageable pageable);

    Page<BookDetail> findByCategoryId(Integer categoryId, Pageable pageable);

    Page<BookDetail> findByAuthorId(Integer authorId, Pageable pageable);

    Page<BookDetail> findByPublisherId(Integer publisherId, Pageable pageable);

    Page<BookDetail> findByBusinessStatus(String status, Pageable pageable);

    Page<BookDetail> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
}
