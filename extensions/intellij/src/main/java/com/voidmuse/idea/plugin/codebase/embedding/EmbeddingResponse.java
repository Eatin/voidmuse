package com.voidmuse.idea.plugin.codebase.embedding;

import lombok.Data;

import java.util.List;

@Data
public class EmbeddingResponse {
    private List<Embedding> results;
}