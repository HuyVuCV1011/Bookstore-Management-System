package com.bookstore.mapper;

import com.bookstore.dto.request.PublisherRequest;
import com.bookstore.dto.response.PublisherResponse;
import com.bookstore.entity.Publisher;
import org.springframework.stereotype.Component;

@Component
public class PublisherMapper {
    public Publisher toEntity(PublisherRequest request) {
        return Publisher.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .build();
    }

    public PublisherResponse toResponse(Publisher publisher) {
        return PublisherResponse.builder()
                .id(publisher.getId())
                .name(publisher.getName())
                .address(publisher.getAddress())
                .phone(publisher.getPhone())
                .email(publisher.getEmail())
                .createdAt(publisher.getCreatedAt())
                .updatedAt(publisher.getUpdatedAt())
                .build();
    }

    public void updateEntity(Publisher publisher, PublisherRequest request) {
        publisher.setName(request.getName());
        publisher.setAddress(request.getAddress());
        publisher.setPhone(request.getPhone());
        publisher.setEmail(request.getEmail());
    }
}
