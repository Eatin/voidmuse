package com.voidmuse.idea.plugin.codebase.embedding;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author zhangdaguan
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizeCodebasePromptResult {
    private List<String> psiNames;
    private String prompt;

}
