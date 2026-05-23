package com.bookstore.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.cassandra.repository.config.EnableCassandraRepositories;

@Configuration
@EnableCassandraRepositories(
        basePackages = "com.bookstore.repository.cassandra"
)
public class CassandraConfig {
}