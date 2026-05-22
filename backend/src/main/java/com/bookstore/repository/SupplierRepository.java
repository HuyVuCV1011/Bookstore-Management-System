package com.bookstore.repository;

import com.bookstore.entity.Supplier;
import com.bookstore.entity.SupplierStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {

    @Query("SELECT s FROM Supplier s WHERE s.deletedAt IS NULL")
    Page<Supplier> findAll(Pageable pageable);

    @Query("SELECT s FROM Supplier s WHERE s.deletedAt IS NULL AND s.id = :id")
    Optional<Supplier> findById(Integer id);

    @Query("SELECT s FROM Supplier s WHERE s.deletedAt IS NULL AND s.status = :status")
    List<Supplier> findByStatus(SupplierStatus status);

    @Query("SELECT s FROM Supplier s WHERE s.deletedAt IS NULL AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.contactPerson) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Supplier> searchByKeyword(String keyword, Pageable pageable);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Integer id);
}
