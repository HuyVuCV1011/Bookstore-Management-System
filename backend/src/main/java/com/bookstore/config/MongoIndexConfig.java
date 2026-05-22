package com.bookstore.config;

import com.bookstore.entity.mongodb.BookDetail;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;

@Configuration
public class MongoIndexConfig {

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        // Text search index on title, author.name, category.name
        TextIndexDefinition textIndex = TextIndexDefinition.builder()
                .onField("title", 10F)
                .onField("author.name", 5F)
                .onField("category.name", 3F)
                .build();

        mongoTemplate.indexOps(BookDetail.class).ensureIndex(textIndex);

        // Regular indexes
        mongoTemplate.indexOps(BookDetail.class)
                .ensureIndex(new Index().on("isbn", Sort.Direction.ASC));

        mongoTemplate.indexOps(BookDetail.class)
                .ensureIndex(new Index().on("category.id", Sort.Direction.ASC));

        mongoTemplate.indexOps(BookDetail.class)
                .ensureIndex(new Index().on("author.id", Sort.Direction.ASC));

        mongoTemplate.indexOps(BookDetail.class)
                .ensureIndex(new Index().on("businessStatus", Sort.Direction.ASC));
    }
}
