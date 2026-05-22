package com.bookstore.repository;

import com.bookstore.entity.CatalogStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CatalogStatisticsRepository extends JpaRepository<CatalogStatistics, Integer> {

    Optional<CatalogStatistics> findByCategoryId(Integer categoryId);

    Optional<CatalogStatistics> findByCategoryName(String categoryName);
}
