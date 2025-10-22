package com.voidmuse.idea.plugin.codebase.symbol;

import com.google.common.collect.Lists;
import com.intellij.psi.PsiClass;
import com.intellij.psi.PsiField;
import com.intellij.psi.PsiFile;
import com.intellij.psi.PsiMethod;
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
public class SymbolIndexSearchResult {
    private List<PsiClass> clazzList = Lists.newArrayList();
    private List<PsiMethod> methodList = Lists.newArrayList();
    private List<PsiField> fieldList = Lists.newArrayList();
    private List<PsiFile> fileList = Lists.newArrayList();
}
