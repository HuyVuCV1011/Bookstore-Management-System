package com.bookstore.service;

import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.event.BookChangedEvent;
import com.bookstore.event.ChangeType;
import com.bookstore.handler.BookDetailEventHandler;
import com.bookstore.listener.OutboxEventPublishListener;
import com.bookstore.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@org.springframework.test.context.TestPropertySource(properties = {
    "app.outbox.scheduler.delay-ms=3600000",
    "app.outbox.scheduler.initial-delay-ms=3600000"
})
@DataJpaTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
@Import({
    org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration.class,
    OutboxEventPublishListener.class,
    OutboxEventProcessor.class
})
public class OutboxEventProcessorTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("bookstore")
            .withUsername("bookstore_user")
            .withPassword("password");

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private OutboxEventProcessor outboxEventProcessor;

    @MockBean
    private BookDetailEventHandler bookDetailEventHandler;

    @MockBean
    private BookGraphProjectionService bookGraphProjectionService;

    @MockBean
    private CustomerGraphProjectionService customerGraphProjectionService;

    @BeforeEach
    void setUp() {
        outboxEventRepository.deleteAll();
    }

    @Test
    void testOutboxEventLifecycle_Success() {
        // 1. Publish event
        BookChangedEvent event = new BookChangedEvent(42, ChangeType.INSERT);
        eventPublisher.publishEvent(event);

        // Verify it was saved to PostgreSQL Outbox table as PENDING
        List<OutboxEvent> pendingEvents = outboxEventRepository.findUnprocessedEvents(5);
        assertThat(pendingEvents).hasSize(1);
        OutboxEvent outboxEvent = pendingEvents.get(0);
        assertThat(outboxEvent.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(outboxEvent.getAttempts()).isEqualTo(0);
        assertThat(outboxEvent.getEventType()).isEqualTo(BookChangedEvent.class.getName());

        // 2. Process event
        outboxEventProcessor.processUnprocessedEvents();

        // Verify the handler was called
        verify(bookDetailEventHandler, times(1)).handleBookChanged(any(BookChangedEvent.class));

        // Verify status is updated to COMPLETED in the database
        OutboxEvent processedEvent = outboxEventRepository.findById(outboxEvent.getId()).orElseThrow();
        assertThat(processedEvent.getStatus()).isEqualTo(OutboxStatus.COMPLETED);
        assertThat(processedEvent.getAttempts()).isEqualTo(1);
        assertThat(processedEvent.getProcessedAt()).isNotNull();
        assertThat(processedEvent.getLastError()).isNull();
    }

    @Test
    void testOutboxEventLifecycle_FailureAndRetry() {
        // 1. Mock handler to throw an exception
        doThrow(new RuntimeException("Database timeout")).when(bookDetailEventHandler).handleBookChanged(any(BookChangedEvent.class));

        // 2. Publish event
        BookChangedEvent event = new BookChangedEvent(99, ChangeType.UPDATE);
        eventPublisher.publishEvent(event);

        // 3. Process event (Attempt 1)
        outboxEventProcessor.processUnprocessedEvents();

        // Verify handler was called, and status is FAILED
        verify(bookDetailEventHandler, times(1)).handleBookChanged(any(BookChangedEvent.class));
        OutboxEvent failedEvent = outboxEventRepository.findUnprocessedEvents(5).get(0);
        assertThat(failedEvent.getStatus()).isEqualTo(OutboxStatus.FAILED);
        assertThat(failedEvent.getAttempts()).isEqualTo(1);
        assertThat(failedEvent.getLastError()).contains("Database timeout");

        // 4. Process event (Attempt 2)
        outboxEventProcessor.processUnprocessedEvents();

        // Verify handler was called again (total 2 times), and attempts count is incremented to 2
        verify(bookDetailEventHandler, times(2)).handleBookChanged(any(BookChangedEvent.class));
        failedEvent = outboxEventRepository.findUnprocessedEvents(5).get(0);
        assertThat(failedEvent.getAttempts()).isEqualTo(2);

        // 5. Change mock to succeed
        doNothing().when(bookDetailEventHandler).handleBookChanged(any(BookChangedEvent.class));

        // 6. Process event (Attempt 3)
        outboxEventProcessor.processUnprocessedEvents();

        // Verify handler succeeded and status is COMPLETED
        OutboxEvent completedEvent = outboxEventRepository.findById(failedEvent.getId()).orElseThrow();
        assertThat(completedEvent.getStatus()).isEqualTo(OutboxStatus.COMPLETED);
        assertThat(completedEvent.getAttempts()).isEqualTo(3);
        assertThat(completedEvent.getLastError()).isNull();
    }

    @Test
    void testOutboxEventLifecycle_MaxAttemptsExceeded() {
        // 1. Mock handler to throw an exception
        doThrow(new RuntimeException("Persistent failure")).when(bookDetailEventHandler).handleBookChanged(any(BookChangedEvent.class));

        // 2. Publish event
        BookChangedEvent event = new BookChangedEvent(100, ChangeType.DELETE);
        eventPublisher.publishEvent(event);

        // 3. Process event 5 times (Max attempts is 5)
        for (int i = 0; i < 5; i++) {
            outboxEventProcessor.processUnprocessedEvents();
        }

        // Verify handler was called 5 times
        verify(bookDetailEventHandler, times(5)).handleBookChanged(any(BookChangedEvent.class));

        // Since attempts = 5 (max attempts), findUnprocessedEvents should not return it anymore
        List<OutboxEvent> unprocessed = outboxEventRepository.findUnprocessedEvents(5);
        assertThat(unprocessed).isEmpty();

        // Verify the event in the DB has attempts = 5 and status = FAILED
        OutboxEvent finalEvent = outboxEventRepository.findAll().get(0);
        assertThat(finalEvent.getStatus()).isEqualTo(OutboxStatus.FAILED);
        assertThat(finalEvent.getAttempts()).isEqualTo(5);
        assertThat(finalEvent.getLastError()).contains("Persistent failure");
    }
}
