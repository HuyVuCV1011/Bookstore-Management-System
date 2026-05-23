package com.bookstore.controller;

import com.bookstore.config.SecurityConfig;
import com.bookstore.dto.request.ReviewRequest;
import com.bookstore.dto.request.ReviewUpdateRequest;
import com.bookstore.security.CustomUserDetailsService;
import com.bookstore.security.JwtAuthenticationFilter;
import com.bookstore.service.JwtService;
import com.bookstore.service.ReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookReviewController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class BookReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReviewService reviewService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private com.bookstore.repository.cassandra.SessionRepository sessionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createReview_Anonymous_IsUnauthorized() throws Exception {
        ReviewRequest request = new ReviewRequest(100, 5, "Great book");

        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateReview_Anonymous_IsUnauthorized() throws Exception {
        ReviewUpdateRequest request = new ReviewUpdateRequest(4, "Updated comment");

        mockMvc.perform(put("/api/reviews/{reviewId}", "rev123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteOwnReview_Anonymous_IsUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/reviews/{reviewId}", "rev123"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void updateReview_Authenticated_Success() throws Exception {
        ReviewUpdateRequest request = new ReviewUpdateRequest(4, "Updated comment");

        mockMvc.perform(put("/api/reviews/{reviewId}", "rev123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(reviewService).updateReview(eq("rev123"), isNull(UUID.class), eq(request));
    }

    @Test
    @WithMockUser
    void approveReview_NonAdmin_IsForbidden() throws Exception {
        mockMvc.perform(patch("/api/reviews/admin/{reviewId}/approve", "rev123"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    void deleteReviewByAdmin_NonAdmin_IsForbidden() throws Exception {
        mockMvc.perform(delete("/api/reviews/admin/{reviewId}", "rev123"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveReview_Admin_Success() throws Exception {
        mockMvc.perform(patch("/api/reviews/admin/{reviewId}/approve", "rev123"))
                .andExpect(status().isOk());

        verify(reviewService).approveReview("rev123");
    }
}
