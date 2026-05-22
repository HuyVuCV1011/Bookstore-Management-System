package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> content;
    private List<T> data; // Alias for content - used by some frontend APIs
    private int number;
    private int page; // Alias for number - used by some frontend APIs
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean first;

    public static <T> PageResponse<T> of(Page<T> page) {
        List<T> content = page.getContent();
        return PageResponse.<T>builder()
                .content(content)
                .data(content) // Set both content and data
                .number(page.getNumber())
                .page(page.getNumber()) // Set both number and page
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .build();
    }
}
