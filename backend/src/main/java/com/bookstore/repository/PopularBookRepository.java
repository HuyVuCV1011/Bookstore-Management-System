package com.bookstore.repository;

import com.bookstore.entity.PopularBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PopularBookRepository extends JpaRepository<PopularBook, Integer> {

    List<PopularBook> findByCategoryId(Integer categoryId);

    List<PopularBook> findTop10ByOrderByTotalQuantitySoldDesc();
}
