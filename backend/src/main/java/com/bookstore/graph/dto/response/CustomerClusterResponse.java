package com.bookstore.graph.dto.response;

import java.util.List;

public record CustomerClusterResponse(
        String clusterName,
        List<String> customerIds,
        Long clusterSize
) {}
