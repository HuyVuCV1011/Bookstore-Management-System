package com.bookstore.repository;

import com.bookstore.entity.InventoryReorderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryReorderRepository extends JpaRepository<InventoryReorderItem, Integer> {

    List<InventoryReorderItem> findByReorderPriority(String priority);

    List<InventoryReorderItem> findByReorderPriorityIn(List<String> priorities);
}
