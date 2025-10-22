package com.voidmuse.idea.plugin.codebase.embedding;

import lombok.Data;

import java.util.List;

@Data
public class Embedding {
    private List<Double> output;
    private Integer index;
}