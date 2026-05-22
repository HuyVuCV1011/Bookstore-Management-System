package com.bookstore.repository.mongodb;

import com.bookstore.entity.mongodb.Cart;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.UUID;

public interface CartRepository extends MongoRepository<Cart, UUID> {
}
