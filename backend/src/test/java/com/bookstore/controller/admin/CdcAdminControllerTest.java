package com.bookstore.controller.admin;

import com.bookstore.config.SecurityConfig;
import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.security.JwtAuthenticationFilter;
import com.bookstore.service.CdcAdminService;
import com.bookstore.service.JwtService;
import com.bookstore.security.CustomUserDetailsService;
import com.bookstore.repository.cassandra.SessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CdcAdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
public class CdcAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CdcAdminService cdcAdminService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private SessionRepository sessionRepository;

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetOutboxEvents_Admin_Success() throws Exception {
        when(cdcAdminService.getOutboxEvents(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/admin/cdc/outbox")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(cdcAdminService, times(1)).getOutboxEvents(null);
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void testGetOutboxEvents_Customer_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/cdc/outbox")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetOutboxEvents_Anonymous_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/cdc/outbox")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testRetryEvent_Admin_Success() throws Exception {
        doNothing().when(cdcAdminService).retryOutboxEvent(anyInt());

        mockMvc.perform(post("/api/admin/cdc/outbox/retry/42")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(cdcAdminService, times(1)).retryOutboxEvent(42);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testRetryFailedEvents_Admin_Success() throws Exception {
        doNothing().when(cdcAdminService).retryAllFailedOutboxEvents();

        mockMvc.perform(post("/api/admin/cdc/outbox/retry-failed")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(cdcAdminService, times(1)).retryAllFailedOutboxEvents();
    }
}
