#!/bin/bash

# Wait for Cassandra to be ready
echo "Waiting for Cassandra to start..."
until cqlsh bookstore-cassandra -e "DESCRIBE KEYSPACES;" > /dev/null 2>&1; do
  sleep 5
  echo "Cassandra is unavailable - waiting..."
done

echo "Cassandra is up - creating keyspace..."

# Create keyspace
cqlsh bookstore-cassandra -e "CREATE KEYSPACE IF NOT EXISTS bookstore WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};"

echo "Keyspace 'bookstore' created successfully!"
