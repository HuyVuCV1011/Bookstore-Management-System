package com.bookstore.controller;

import com.bookstore.repository.mongodb.BookSearchRepository;
import com.bookstore.service.SearchAutocompleteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.lang.reflect.Method;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookSearchController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookSearchRepository bookSearchRepository;

    @MockBean
    private SearchAutocompleteService autocompleteService;

    @MockBean
    private com.bookstore.service.JwtService jwtService;

    @MockBean
    private com.bookstore.security.CustomUserDetailsService customUserDetailsService;

    @MockBean
    private com.bookstore.repository.cassandra.SessionRepository sessionRepository;

    @Test
    void searchWithoutFilters_ReturnsOnlyActiveBooks() throws Exception {
        when(bookSearchRepository.findByBusinessStatus(eq("ACTIVE"), any()))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/search"))
                .andExpect(status().isOk());

        verify(bookSearchRepository).findByBusinessStatus(eq("ACTIVE"), any());
    }

    @Test
    void categorySearch_ReturnsOnlyActiveBooks() throws Exception {
        when(bookSearchRepository.findByCategoryNameAndBusinessStatus(eq("Fiction"), eq("ACTIVE"), any()))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/search").param("category", "Fiction"))
                .andExpect(status().isOk());

        verify(bookSearchRepository).findByCategoryNameAndBusinessStatus(eq("Fiction"), eq("ACTIVE"), any());
    }

    @Test
    void priceSearch_ReturnsOnlyActiveBooks() throws Exception {
        when(bookSearchRepository.findByPriceBetweenAndBusinessStatus(eq(BigDecimal.TEN), eq(BigDecimal.valueOf(20)), eq("ACTIVE"), any()))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/search")
                        .param("minPrice", "10")
                        .param("maxPrice", "20"))
                .andExpect(status().isOk());

        verify(bookSearchRepository).findByPriceBetweenAndBusinessStatus(eq(BigDecimal.TEN), eq(BigDecimal.valueOf(20)), eq("ACTIVE"), any());
    }

    @Test
    void textSearchRepositoryQuery_FiltersActiveBooks() throws Exception {
        Method method = BookSearchRepository.class.getMethod("searchByText", String.class, org.springframework.data.domain.Pageable.class);
        Query query = method.getAnnotation(Query.class);

        org.junit.jupiter.api.Assertions.assertTrue(query.value().contains("'businessStatus': 'ACTIVE'"));
    }
}
