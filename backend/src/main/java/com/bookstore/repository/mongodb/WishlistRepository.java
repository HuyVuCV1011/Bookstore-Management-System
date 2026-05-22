package com.bookstore.repository.mongodb;

import com.bookstore.entity.mongodb.Wishlist;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.UUID;

public interface WishlistRepository extends MongoRepository<Wishlist, UUID> {
}
