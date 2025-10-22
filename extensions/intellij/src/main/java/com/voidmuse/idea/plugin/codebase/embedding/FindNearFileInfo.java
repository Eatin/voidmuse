package com.voidmuse.idea.plugin.codebase.embedding;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class FindNearFileInfo {

    private String name;

    private String path;

    private Integer startLine;

    private Integer endLine;

    private String content;

    private Double distance;


    public FindNearFileInfo(String name, String path, Integer startLine, Integer endLine) {
        this.name = name;
        this.path = path;
        this.startLine = startLine;
        this.endLine = endLine;
    }
}
