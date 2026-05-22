package com.bookstore.repository;

import com.bookstore.entity.Author;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Integer> {
    @Query("SELECT a FROM Author a WHERE a.deletedAt IS NULL")
    List<Author> findAll();

    @Query("SELECT a FROM Author a WHERE a.deletedAt IS NULL")
    Page<Author> findAll(Pageable pageable);

    @Query("SELECT a FROM Author a WHERE a.deletedAt IS NULL AND LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Author> findByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT a FROM Author a WHERE a.id = :id AND a.deletedAt IS NULL")
    Optional<Author> findById(@Param("id") Integer id);
}
