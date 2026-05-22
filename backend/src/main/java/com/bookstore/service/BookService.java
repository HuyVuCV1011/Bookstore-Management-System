package com.bookstore.service;

import com.bookstore.dto.request.BookRequest;
import com.bookstore.dto.response.BookResponse;
import com.bookstore.entity.Author;
import com.bookstore.entity.Book;
import com.bookstore.entity.Category;
import com.bookstore.entity.Publisher;
import com.bookstore.event.BookGraphProjectionAction;
import com.bookstore.event.BookGraphProjectionEvent;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.BookMapper;
import com.bookstore.repository.AuthorRepository;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.CategoryRepository;
import com.bookstore.repository.PublisherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class BookService {
    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final BookMapper bookMapper;
    private final ApplicationEventPublisher eventPublisher;

    public BookResponse create(BookRequest request) {
        // Validate foreign keys
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Author author = authorRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + request.getAuthorId()));

        Publisher publisher = publisherRepository.findById(request.getPublisherId())
                .orElseThrow(() -> new ResourceNotFoundException("Publisher not found with id: " + request.getPublisherId()));

        // Build book entity
        Book book = Book.builder()
                .category(category)
                .author(author)
                .publisher(publisher)
                .title(request.getTitle())
                .isbn(request.getIsbn())
                .coverUrl(request.getCoverUrl())
                .publicationYear(request.getPublicationYear())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .description(request.getDescription())
                .businessStatus(request.getBusinessStatus())
                .storageLocation(request.getStorageLocation())
                .build();

        Book saved = bookRepository.save(book);
        eventPublisher.publishEvent(new BookGraphProjectionEvent(saved.getId(), saved.getIsbn(), BookGraphProjectionAction.UPSERT));
        return bookMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookResponse getById(Integer id) {
        Book book = findByIdOrThrow(id);
        return bookMapper.toResponse(book);
    }

    @Transactional(readOnly = true)
    public BookResponse getByIsbn(String isbn) {
        Book book = bookRepository.findActiveByIsbn(isbn)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ISBN: " + isbn));
        return bookMapper.toResponse(book);
    }

    @Transactional(readOnly = true)
    public Page<BookResponse> getAll(Pageable pageable, String keyword) {
        Page<Book> books = (keyword != null && !keyword.isBlank())
                ? bookRepository.findByKeyword(keyword, pageable)
                : bookRepository.findAll(pageable);
        return books.map(bookMapper::toResponse);
    }

    public BookResponse update(Integer id, BookRequest request) {
        Book book = findByIdOrThrow(id);
        String previousIsbn = book.getIsbn();

        // Validate foreign keys
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Author author = authorRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + request.getAuthorId()));

        Publisher publisher = publisherRepository.findById(request.getPublisherId())
                .orElseThrow(() -> new ResourceNotFoundException("Publisher not found with id: " + request.getPublisherId()));

        // Update relationships
        book.setCategory(category);
        book.setAuthor(author);
        book.setPublisher(publisher);

        // Update other fields
        bookMapper.updateEntity(book, request);

        Book updated = bookRepository.save(book);
        if (previousIsbn != null && !previousIsbn.equals(updated.getIsbn())) {
            eventPublisher.publishEvent(new BookGraphProjectionEvent(updated.getId(), previousIsbn, BookGraphProjectionAction.DEACTIVATE));
        }
        eventPublisher.publishEvent(new BookGraphProjectionEvent(updated.getId(), updated.getIsbn(), BookGraphProjectionAction.UPSERT));
        return bookMapper.toResponse(updated);
    }

    public void delete(Integer id) {
        Book book = findByIdOrThrow(id);
        book.setDeletedAt(LocalDateTime.now());
        bookRepository.save(book);
        eventPublisher.publishEvent(new BookGraphProjectionEvent(book.getId(), book.getIsbn(), BookGraphProjectionAction.DEACTIVATE));
    }

    private Book findByIdOrThrow(Integer id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
    }
}
