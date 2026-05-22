package com.bookstore.repository;

import com.bookstore.entity.Publisher;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PublisherRepository extends JpaRepository<Publisher, Integer> {
    @Query("SELECT p FROM Publisher p WHERE p.deletedAt IS NULL")
    List<Publisher> findAll();

    @Query("SELECT p FROM Publisher p WHERE p.deletedAt IS NULL")
    Page<Publisher> findAll(Pageable pageable);

    @Query("SELECT p FROM Publisher p WHERE p.deletedAt IS NULL AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Publisher> findByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Publisher p WHERE p.id = :id AND p.deletedAt IS NULL")
    Optional<Publisher> findById(@Param("id") Integer id);
}
