package com.voidmuse.idea.plugin.codebase.embedding;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChunkMetaInfo {
    private String path;

    private Integer startLine;

    private Integer endLine;
}
