package com.bookstore.mapper;

import com.bookstore.dto.request.SupplierRequest;
import com.bookstore.dto.response.SupplierResponse;
import com.bookstore.entity.Supplier;
import com.bookstore.entity.SupplierStatus;
import org.springframework.stereotype.Component;

@Component
public class SupplierMapper {

    public Supplier toEntity(SupplierRequest request) {
        return Supplier.builder()
                .name(request.getName())
                .contactPerson(request.getContactPerson())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .paymentTerms(request.getPaymentTerms())
                .status(SupplierStatus.ACTIVE)
                .build();
    }

    public SupplierResponse toResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .contactPerson(supplier.getContactPerson())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .address(supplier.getAddress())
                .paymentTerms(supplier.getPaymentTerms())
                .status(supplier.getStatus())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }

    public void updateEntity(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.getName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setPaymentTerms(request.getPaymentTerms());
    }
}
