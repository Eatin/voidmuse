package com.voidmuse.idea.plugin.completion.psi

import com.intellij.psi.PsiElement
import com.voidmuse.idea.plugin.completion.InfillContext

interface LanguageContextFinder {
    /**
     * Determines relevant enclosing [PsiElement] and [PsiElement]s relevant to the context and returns their source code [PsiElement].
     */
    fun findContext(psiElement: PsiElement): InfillContext
}