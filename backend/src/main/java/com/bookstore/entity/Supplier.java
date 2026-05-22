package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "suppliers")
@Data
@EqualsAndHashCode(callSuper = false)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Supplier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(nullable = false)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private SupplierStatus status = SupplierStatus.ACTIVE;
}
