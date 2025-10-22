package com.voidmuse.idea.plugin.completion

import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.voidmuse.idea.plugin.common.EncodingManager
import com.voidmuse.idea.plugin.completion.psi.CompletionContextService
import com.voidmuse.idea.plugin.completion.psi.readText

object InfillRequestUtil {
    private val logger = thisLogger()

    fun buildInfillRequest(editor: Editor, type: CompletionType): InfillRequest {
        val caretOffset = editor.caretModel.offset
        val infillRequestBuilder = InfillRequest.Builder(editor.document, editor, caretOffset, type)
            .fileDetails(
                InfillRequest.FileDetails(
                    editor.document.text,
                    editor.virtualFile.extension
                )
            )

        editor.project ?: return infillRequestBuilder.build()

        getInfillContext(editor, caretOffset)?.let { infillRequestBuilder.context(it) }

        return infillRequestBuilder.build()
    }

    private fun getInfillContext(
        editor: Editor,
        caretOffset: Int
    ): InfillContext? {
        val infillContext = service<CompletionContextService>().findContext(editor, caretOffset) ?: return null
        val caretInEnclosingElement =
            caretOffset - infillContext.enclosingElement.psiElement.textRange.startOffset
        val entireText = infillContext.enclosingElement.psiElement.readText()
        val prefix = entireText.take(caretInEnclosingElement)
        val suffix =
            if (entireText.length < caretInEnclosingElement) "" else entireText.takeLast(
                entireText.length - caretInEnclosingElement
            )
        return truncateContext(prefix + suffix, infillContext)
    }

    private fun truncateContext(prompt: String, infillContext: InfillContext): InfillContext {
        var promptTokens = EncodingManager.getInstance().countTokens(prompt)
        val truncatedContextElements = infillContext.contextElements.takeWhile {
            promptTokens += it.tokens
            promptTokens <= MAX_PROMPT_TOKENS
        }.toSet()
        return InfillContext(infillContext.enclosingElement, truncatedContextElements)
    }
}