package com.bookstore.repository;

import com.bookstore.entity.Book;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

@Repository
public interface BookRepository extends JpaRepository<Book, Integer> {
    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL")
    Page<Book> findAll(Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Book> findByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.id = :id AND b.deletedAt IS NULL")
    Optional<Book> findById(@Param("id") Integer id);

    @Query("SELECT b FROM Book b WHERE b.isbn = :isbn AND b.deletedAt IS NULL")
    Optional<Book> findActiveByIsbn(@Param("isbn") String isbn);

    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL")
    List<Book> findAllActive();

    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND b.author.id = :authorId")
    List<Book> findAllActiveByAuthorId(@Param("authorId") Integer authorId);

    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND b.category.id = :categoryId")
    List<Book> findAllActiveByCategoryId(@Param("categoryId") Integer categoryId);

    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND b.publisher.id = :publisherId")
    List<Book> findAllActiveByPublisherId(@Param("publisherId") Integer publisherId);

    @EntityGraph(attributePaths = {"author", "category", "publisher"})
    @Query("SELECT b FROM Book b WHERE b.id = :id AND b.deletedAt IS NULL")
    Optional<Book> findByIdWithRelations(@Param("id") Integer id);

    @EntityGraph(attributePaths = {"author", "category", "publisher"})
    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND b.author.id = :authorId")
    List<Book> findAllByAuthorIdWithRelations(@Param("authorId") Integer authorId);

    @EntityGraph(attributePaths = {"author", "category", "publisher"})
    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND b.category.id = :categoryId")
    List<Book> findAllByCategoryIdWithRelations(@Param("categoryId") Integer categoryId);

    @EntityGraph(attributePaths = {"author", "category", "publisher"})
    @Query("SELECT b FROM Book b WHERE b.deletedAt IS NULL AND b.publisher.id = :publisherId")
    List<Book> findAllByPublisherIdWithRelations(@Param("publisherId") Integer publisherId);

    @Query("SELECT COALESCE(SUM(b.price * b.stockQuantity), 0) FROM Book b WHERE b.deletedAt IS NULL")
    BigDecimal calculateTotalInventoryValue();

    @Query("SELECT COUNT(b) FROM Book b WHERE b.deletedAt IS NULL AND b.stockQuantity < :threshold")
    Long countByStockQuantityLessThan(@Param("threshold") int threshold);

    @Query("SELECT COALESCE(SUM(b.stockQuantity), 0) FROM Book b WHERE b.deletedAt IS NULL")
    Long sumStockQuantity();
}
