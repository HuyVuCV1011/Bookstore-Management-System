package com.bookstore.service;

import com.bookstore.dto.request.CategoryRequest;
import com.bookstore.dto.response.CategoryResponse;
import com.bookstore.entity.Category;
import com.bookstore.event.BookGraphMetadataProjectionEvent;
import com.bookstore.event.BookGraphMetadataProjectionType;
import com.bookstore.exception.BusinessRuleException;
import com.bookstore.exception.DuplicateResourceException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.CategoryMapper;
import com.bookstore.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ApplicationEventPublisher eventPublisher;

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Category with name '" + request.getName() + "' already exists");
        }

        Category category = categoryMapper.toEntity(request);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Integer id) {
        Category category = findByIdOrThrow(id);
        return categoryMapper.toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAll(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(categoryMapper::toResponse);
    }

    public CategoryResponse update(Integer id, CategoryRequest request) {
        Category category = findByIdOrThrow(id);

        if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new DuplicateResourceException("Category with name '" + request.getName() + "' already exists");
        }

        categoryMapper.updateEntity(category, request);
        Category updated = categoryRepository.save(category);
        eventPublisher.publishEvent(new BookGraphMetadataProjectionEvent(BookGraphMetadataProjectionType.CATEGORY, updated.getId()));
        return categoryMapper.toResponse(updated);
    }

    public void delete(Integer id) {
        Category category = findByIdOrThrow(id);
        category.setDeletedAt(LocalDateTime.now());
        categoryRepository.save(category);
        eventPublisher.publishEvent(new BookGraphMetadataProjectionEvent(BookGraphMetadataProjectionType.CATEGORY, category.getId()));
    }

    private Category findByIdOrThrow(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }
}
