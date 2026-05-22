package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "customers")
@Data
@EqualsAndHashCode(callSuper = false)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(nullable = false)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "profile_completed", nullable = false)
    @Builder.Default
    private boolean profileCompleted = false;

    @Column(name = "registration_date", nullable = false)
    @Builder.Default
    private LocalDate registrationDate = LocalDate.now();

}
