package com.bookstore.repository;

import com.bookstore.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    @Query("SELECT c FROM Category c WHERE c.deletedAt IS NULL")
    List<Category> findAll();

    @Query("SELECT c FROM Category c WHERE c.deletedAt IS NULL")
    Page<Category> findAll(Pageable pageable);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Category> findById(@Param("id") Integer id);

    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE c.name = :name AND c.deletedAt IS NULL")
    boolean existsByName(@Param("name") String name);

    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE c.name = :name AND c.id != :id AND c.deletedAt IS NULL")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("id") Integer id);
}
