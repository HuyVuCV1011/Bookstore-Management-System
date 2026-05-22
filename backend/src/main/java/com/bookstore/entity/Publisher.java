package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "publishers")
@EntityListeners(com.bookstore.listener.PublisherEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Publisher extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String phone;

    private String email;
}
