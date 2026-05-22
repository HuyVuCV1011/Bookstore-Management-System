package com.bookstore.repository;

import com.bookstore.entity.WarehouseStaff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WarehouseStaffRepository extends JpaRepository<WarehouseStaff, UUID> {

    @Query("SELECT ws FROM WarehouseStaff ws " +
           "WHERE ws.deletedAt IS NULL " +
           "AND (LOWER(ws.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(ws.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(ws.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<WarehouseStaff> searchByKeyword(String keyword, Pageable pageable);

    @Query("SELECT ws FROM WarehouseStaff ws WHERE ws.deletedAt IS NULL")
    Page<WarehouseStaff> findAll(Pageable pageable);
}
