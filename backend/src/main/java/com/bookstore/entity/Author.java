package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "authors")
@EntityListeners(com.bookstore.listener.AuthorEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Author extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String biography;
}
