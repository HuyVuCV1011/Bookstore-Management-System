package com.bookstore.repository;

import com.bookstore.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    Optional<Customer> findByUserId(UUID userId);

    Optional<Customer> findByEmail(String email);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    List<Customer> findAllActive();

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    Page<Customer> findAllActive(Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL AND " +
           "(LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Customer> searchActive(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT c FROM Customer c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Customer> findActiveById(@Param("id") Integer id);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT c FROM Customer c WHERE c.user.id = :userId AND c.deletedAt IS NULL")
    Optional<Customer> findActiveByUserId(@Param("userId") UUID userId);
}
