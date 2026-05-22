package com.bookstore.service;

import com.bookstore.dto.request.PublisherRequest;
import com.bookstore.dto.response.PublisherResponse;
import com.bookstore.entity.Publisher;
import com.bookstore.event.BookGraphMetadataProjectionEvent;
import com.bookstore.event.BookGraphMetadataProjectionType;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.PublisherMapper;
import com.bookstore.repository.PublisherRepository;
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
public class PublisherService {
    private final PublisherRepository publisherRepository;
    private final PublisherMapper publisherMapper;
    private final ApplicationEventPublisher eventPublisher;

    public PublisherResponse create(PublisherRequest request) {
        Publisher publisher = publisherMapper.toEntity(request);
        Publisher saved = publisherRepository.save(publisher);
        return publisherMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PublisherResponse getById(Integer id) {
        Publisher publisher = findByIdOrThrow(id);
        return publisherMapper.toResponse(publisher);
    }

    @Transactional(readOnly = true)
    public List<PublisherResponse> getAll() {
        return publisherRepository.findAll().stream()
                .map(publisherMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PublisherResponse> getAll(Pageable pageable, String keyword) {
        Page<Publisher> publishers = (keyword != null && !keyword.isBlank())
                ? publisherRepository.findByKeyword(keyword, pageable)
                : publisherRepository.findAll(pageable);
        return publishers.map(publisherMapper::toResponse);
    }

    public PublisherResponse update(Integer id, PublisherRequest request) {
        Publisher publisher = findByIdOrThrow(id);
        publisherMapper.updateEntity(publisher, request);
        Publisher updated = publisherRepository.save(publisher);
        eventPublisher.publishEvent(new BookGraphMetadataProjectionEvent(BookGraphMetadataProjectionType.PUBLISHER, updated.getId()));
        return publisherMapper.toResponse(updated);
    }

    public void delete(Integer id) {
        Publisher publisher = findByIdOrThrow(id);
        publisher.setDeletedAt(LocalDateTime.now());
        publisherRepository.save(publisher);
        eventPublisher.publishEvent(new BookGraphMetadataProjectionEvent(BookGraphMetadataProjectionType.PUBLISHER, publisher.getId()));
    }

    private Publisher findByIdOrThrow(Integer id) {
        return publisherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher not found with id: " + id));
    }
}
