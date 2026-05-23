package com.bookstore.security;

import com.bookstore.config.SecurityConfig;
import com.bookstore.controller.BookController;
import com.bookstore.controller.OrderController;
import com.bookstore.dto.request.BookRequest;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.repository.cassandra.SessionRepository;
import com.bookstore.service.BookSearchService;
import com.bookstore.service.BookService;
import com.bookstore.service.InteractionEventService;
import com.bookstore.service.JwtService;
import com.bookstore.service.OrderHistoryService;
import com.bookstore.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bookstore.exception.ResourceNotFoundException;
import java.util.UUID;

@WebMvcTest(controllers = {BookController.class, OrderController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class SecurityBoundaryTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookService bookService;

    @MockBean
    private BookSearchService bookSearchService;

    @MockBean
    private com.bookstore.mapper.BookDetailMapper bookDetailMapper;

    @MockBean
    private InteractionEventService interactionEventService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private OrderHistoryService orderHistoryService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private SessionRepository sessionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void publicCatalogGet_Anonymous_IsAllowed() throws Exception {
        Mockito.when(bookSearchService.getAllBooks(any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk());
    }

    @Test
    void catalogWrite_Anonymous_IsUnauthorized() throws Exception {
        BookRequest request = new BookRequest();
        request.setTitle("Test Book");
        request.setIsbn("1234567890123");
        request.setPrice(BigDecimal.valueOf(10.00));
        request.setStockQuantity(5);
        request.setPublicationYear(2025);
        request.setAuthorId(1);
        request.setCategoryId(1);
        request.setPublisherId(1);
        request.setBusinessStatus(BusinessStatus.ACTIVE);

        // Anonymous write should be rejected with a 4xx error (either 401 or 403)
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void adminDeleteCatalog_Customer_IsForbidden() throws Exception {
        mockMvc.perform(delete("/api/books/{id}", 1))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminDeleteCatalog_Admin_IsAllowed() throws Exception {
        mockMvc.perform(delete("/api/books/{id}", 1))
                .andExpect(status().isNoContent());
    }

    @Test
    void getOrder_Anonymous_IsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/orders/{id}", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void updateOrderStatus_Customer_IsForbidden() throws Exception {
        mockMvc.perform(put("/api/orders/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderStatus\": \"SHIPPED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getOrder_AnotherCustomerOrder_IsNotFound() throws Exception {
        UUID otherOrderId = UUID.randomUUID();
        Mockito.when(orderService.getOrderByUUID(eq(otherOrderId)))
                .thenThrow(new ResourceNotFoundException("Order not found with id: " + otherOrderId));

        mockMvc.perform(get("/api/orders/{id}", otherOrderId))
                .andExpect(status().isNotFound());
    }
}
