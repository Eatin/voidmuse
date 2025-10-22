package com.voidmuse.idea.plugin.codebase.embedding;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChunkFileInfo {
    private String content;

    private Integer startLine;

    private Integer endLine;
}
