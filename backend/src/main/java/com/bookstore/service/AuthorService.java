package com.bookstore.service;

import com.bookstore.dto.request.AuthorRequest;
import com.bookstore.dto.response.AuthorResponse;
import com.bookstore.entity.Author;
import com.bookstore.event.BookGraphMetadataProjectionEvent;
import com.bookstore.event.BookGraphMetadataProjectionType;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.AuthorMapper;
import com.bookstore.repository.AuthorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthorService {
    private final AuthorRepository authorRepository;
    private final AuthorMapper authorMapper;
    private final ApplicationEventPublisher eventPublisher;

    public AuthorResponse create(AuthorRequest request) {
        Author author = authorMapper.toEntity(request);
        Author saved = authorRepository.save(author);
        return authorMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthorResponse getById(Integer id) {
        Author author = findByIdOrThrow(id);
        return authorMapper.toResponse(author);
    }

    @Transactional(readOnly = true)
    public List<AuthorResponse> getAll() {
        return authorRepository.findAll().stream()
                .map(authorMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuthorResponse> getAll(Pageable pageable, String keyword) {
        Page<Author> authors = (keyword != null && !keyword.isBlank())
                ? authorRepository.findByKeyword(keyword, pageable)
                : authorRepository.findAll(pageable);
        return authors.map(authorMapper::toResponse);
    }

    public AuthorResponse update(Integer id, AuthorRequest request) {
        Author author = findByIdOrThrow(id);
        authorMapper.updateEntity(author, request);
        Author updated = authorRepository.save(author);
        eventPublisher.publishEvent(new BookGraphMetadataProjectionEvent(BookGraphMetadataProjectionType.AUTHOR, updated.getId()));
        return authorMapper.toResponse(updated);
    }

    public void delete(Integer id) {
        Author author = findByIdOrThrow(id);
        author.setDeletedAt(LocalDateTime.now());
        authorRepository.save(author);
        eventPublisher.publishEvent(new BookGraphMetadataProjectionEvent(BookGraphMetadataProjectionType.AUTHOR, author.getId()));
    }

    private Author findByIdOrThrow(Integer id) {
        return authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + id));
    }
}
