package com.bookstore.mapper;

import com.bookstore.dto.request.AuthorRequest;
import com.bookstore.dto.response.AuthorResponse;
import com.bookstore.entity.Author;
import org.springframework.stereotype.Component;

@Component
public class AuthorMapper {
    public Author toEntity(AuthorRequest request) {
        return Author.builder()
                .name(request.getName())
                .biography(request.getBiography())
                .build();
    }

    public AuthorResponse toResponse(Author author) {
        return AuthorResponse.builder()
                .id(author.getId())
                .name(author.getName())
                .biography(author.getBiography())
                .createdAt(author.getCreatedAt())
                .updatedAt(author.getUpdatedAt())
                .build();
    }

    public void updateEntity(Author author, AuthorRequest request) {
        author.setName(request.getName());
        author.setBiography(request.getBiography());
    }
}
