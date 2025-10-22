package com.voidmuse.idea.plugin.codebase.symbol;

import com.google.common.collect.Lists;
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
public class SymbolIndexSearchFilePaths {
    private List<String> clazzPaths = Lists.newArrayList();
    private List<String> methodPaths = Lists.newArrayList();
    private List<String> fieldPaths = Lists.newArrayList();
    private List<String> filePaths = Lists.newArrayList();
    private List<String> textFilePaths = Lists.newArrayList();
}
