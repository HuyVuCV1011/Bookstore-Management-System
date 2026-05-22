package com.bookstore.controller;

import com.bookstore.dto.response.AutocompleteResponse;
import com.bookstore.service.SearchAutocompleteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchAutocompleteController {

    private final SearchAutocompleteService autocompleteService;

    @GetMapping("/autocomplete")
    public ResponseEntity<List<AutocompleteResponse>> autocomplete(@RequestParam String q) {
        return ResponseEntity.ok(autocompleteService.getSuggestions(q));
    }

    @GetMapping("/trending/keywords")
    public ResponseEntity<List<String>> getTrendingKeywords(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(autocompleteService.getTrendingKeywords(limit));
    }

    @GetMapping("/trending/books")
    public ResponseEntity<List<AutocompleteResponse>> getTrendingBooks(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(autocompleteService.getTrendingBooks(limit));
    }

    @PostMapping("/record-keyword")
    public ResponseEntity<Void> recordKeyword(@RequestParam String keyword) {
        autocompleteService.recordSearchKeyword(keyword);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/record-book")
    public ResponseEntity<Void> recordBook(@RequestParam String bookId) {
        autocompleteService.recordBookSelection(bookId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rebuild-index")
    public ResponseEntity<String> rebuildIndex() {
        autocompleteService.rebuildAutocompleteIndex();
        return ResponseEntity.ok("Autocomplete index rebuild triggered");
    }
}
