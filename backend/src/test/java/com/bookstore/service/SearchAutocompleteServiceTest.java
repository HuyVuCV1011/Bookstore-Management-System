package com.bookstore.service;

import com.bookstore.dto.response.AutocompleteResponse;
import com.bookstore.repository.mongodb.BookSearchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchAutocompleteServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private ZSetOperations<String, Object> zSetOperations;
    @Mock
    private BookSearchRepository bookSearchRepository;

    private SearchAutocompleteService autocompleteService;

    @BeforeEach
    void setUp() {
        autocompleteService = new SearchAutocompleteService(redisTemplate, bookSearchRepository);
    }

    @Test
    void getSuggestions_ShouldReturnEmptyList_WhenPrefixIsEmpty() {
        List<AutocompleteResponse> results = autocompleteService.getSuggestions("");
        assertTrue(results.isEmpty());
    }

    @Test
    void getSuggestions_ShouldReturnMappedResults_WhenPrefixIsValid() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        Set<Object> redisResults = new HashSet<>();
        redisResults.add("clean code:1");
        redisResults.add("clean architecture:2");

        when(zSetOperations.range("search:autocomplete", 0, -1))
                .thenReturn(redisResults);

        List<AutocompleteResponse> results = autocompleteService.getSuggestions("clean");

        assertEquals(2, results.size());
        assertTrue(results.stream().anyMatch(r -> r.getTitle().equals("clean code") && r.getBookId().equals("1")));
    }

    @Test
    void recordSearchKeyword_ShouldCallRedisIncrement() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        autocompleteService.recordSearchKeyword("java");
        verify(zSetOperations).incrementScore(eq("search:trending:keywords"), eq("java"), eq(1.0));
    }

    @Test
    void recordBookSelection_ShouldCallRedisIncrement() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        autocompleteService.recordBookSelection("123");
        verify(zSetOperations).incrementScore(eq("search:trending:books"), eq("123"), eq(1.0));
    }
}
