package com.bookstore.service;

import com.bookstore.dto.request.SupplierRequest;
import com.bookstore.dto.response.SupplierResponse;
import com.bookstore.entity.Supplier;
import com.bookstore.entity.SupplierStatus;
import com.bookstore.exception.DuplicateResourceException;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.SupplierMapper;
import com.bookstore.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
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
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    public SupplierResponse create(SupplierRequest request) {
        if (supplierRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Supplier with email '" + request.getEmail() + "' already exists");
        }

        Supplier supplier = supplierMapper.toEntity(request);
        Supplier saved = supplierRepository.save(supplier);
        return supplierMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(Integer id) {
        Supplier supplier = findByIdOrThrow(id);
        return supplierMapper.toResponse(supplier);
    }

    @Transactional(readOnly = true)
    public Page<SupplierResponse> getAll(Pageable pageable) {
        return supplierRepository.findAll(pageable)
                .map(supplierMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<SupplierResponse> search(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAll(pageable);
        }
        return supplierRepository.searchByKeyword(keyword, pageable)
                .map(supplierMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getActiveSuppliers() {
        return supplierRepository.findByStatus(SupplierStatus.ACTIVE).stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    public SupplierResponse update(Integer id, SupplierRequest request) {
        Supplier supplier = findByIdOrThrow(id);

        if (supplierRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateResourceException("Supplier with email '" + request.getEmail() + "' already exists");
        }

        supplierMapper.updateEntity(supplier, request);
        Supplier updated = supplierRepository.save(supplier);
        return supplierMapper.toResponse(updated);
    }

    public SupplierResponse updateStatus(Integer id, SupplierStatus status) {
        Supplier supplier = findByIdOrThrow(id);
        supplier.setStatus(status);
        Supplier updated = supplierRepository.save(supplier);
        return supplierMapper.toResponse(updated);
    }

    public void delete(Integer id) {
        Supplier supplier = findByIdOrThrow(id);
        supplier.setDeletedAt(LocalDateTime.now());
        supplierRepository.save(supplier);
    }

    private Supplier findByIdOrThrow(Integer id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }
}
