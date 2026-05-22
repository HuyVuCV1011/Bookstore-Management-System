package com.bookstore.repository;

import com.bookstore.entity.Role;
import com.bookstore.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByRole(Role role, Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = :role
              AND LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<User> searchByRoleAndKeyword(
            @Param("role") Role role,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<User> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true")
    List<User> findActiveByRole(@Param("role") Role role);
}
