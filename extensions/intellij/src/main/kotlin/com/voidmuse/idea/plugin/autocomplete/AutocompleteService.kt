package com.voidmuse.idea.plugin.autocomplete

import cn.hutool.core.codec.Base64
import com.intellij.injected.editor.VirtualFileWindow
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.WriteAction
import com.intellij.openapi.application.invokeLater
import com.intellij.openapi.application.runReadAction
import com.intellij.openapi.components.Service
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.InlayProperties
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiElement
import com.voidmuse.idea.plugin.completion.CompletionType
import com.voidmuse.idea.plugin.completion.InfillRequestUtil
import com.voidmuse.idea.plugin.domain.EditCodeContext
import com.voidmuse.idea.plugin.service.CallJavaScriptService
import com.voidmuse.idea.plugin.util.SpinnerIconManager
import java.util.*

data class PendingCompletion(
    val editor: Editor,
    var offset: Int,
    val completionId: String,
    var text: String?
)


fun PsiElement.isInjectedText(): Boolean {
    val virtualFile = this.containingFile.virtualFile ?: return false
    return virtualFile is VirtualFileWindow
}

@Service(Service.Level.PROJECT)
class AutocompleteService(private val project: Project) {
    var pendingCompletion: PendingCompletion? = null;

    init {
    }

    fun triggerCompletion(editor: Editor) {
        if (pendingCompletion != null) {
            clearCompletions(pendingCompletion!!.editor)
        }

        val completionId = UUID.randomUUID().toString()
        val offset = editor.caretModel.primaryCaret.offset
        val lineNumber = editor.document.getLineNumber(offset);
        pendingCompletion = PendingCompletion(editor, offset, completionId, null)

        val requestDetails = InfillRequestUtil.buildInfillRequest(editor, CompletionType.MULTI_LINE)
        val virtualFile = FileDocumentManager.getInstance().getFile(editor.document)

        val contextElements = requestDetails.context?.contextElements?.map { contextElement ->
            EditCodeContext(
                "file",
                contextElement.filePath(),
                Base64.encode(contextElement.text())
            )
        } ?: emptyList()

        val paramMap = hashMapOf<String, Any>().apply {
            put("prefix", Base64.encode(requestDetails.prefix))
            put("suffix", Base64.encode(requestDetails.suffix))
            virtualFile?.fileType?.name?.let { put("language", it) }
            put("contexts", contextElements)
        }

        SpinnerIconManager.showSpinnerIcon(editor, lineNumber);
        CallJavaScriptService.getInstance(project).callJavaScriptAsync(
            "codeCompletion", paramMap,
            object : CallJavaScriptService.Callback {
                override fun run(args: Map<String, Any>) {
                    val result: String = args["data"].toString().trimStart()
                    SpinnerIconManager.hideSpinnerIcon(editor)
                    renderCompletion(editor, offset, result)
                    pendingCompletion = pendingCompletion?.copy(text = result)
                }

                override fun timeout() {
                    SpinnerIconManager.hideSpinnerIcon(editor)
                }
            }
        )
    }

    private fun renderCompletion(editor: Editor, offset: Int, completion: String) {
        if (completion.isEmpty()) {
            return
        }
        if (isInjectedFile(editor)) return

        ApplicationManager.getApplication().invokeLater {
            WriteAction.run<Throwable> {
                // Clear existing completions
                hideCompletions(editor)

                val properties = InlayProperties()
                properties.relatesToPrecedingText(true)
                properties.disableSoftWrapping(true)

                if (completion.lines().size > 1) {
                    editor.inlayModel.addBlockElement(
                        offset,
                        properties,
                        MultilineCustomElementRenderer(editor, completion)
                    )
                } else {
                    editor.inlayModel.addInlineElement(
                        offset,
                        properties,
                        CustomElementRenderer(editor, completion)
                    )
                }
            }
        }
    }

    fun accept() {
        val completion = pendingCompletion ?: return
        val text = completion.text ?: return
        val editor = completion.editor
        val offset = completion.offset
        editor.document.insertString(offset, text)

        editor.caretModel.moveToOffset(offset + text.length)

        invokeLater {
            clearCompletions(editor)
        }
    }

    private fun cancelCompletion(completion: PendingCompletion) {
        SpinnerIconManager.hideSpinnerIcon(completion.editor);
    }

    fun clearCompletions(editor: Editor) {
        if (isInjectedFile(editor)) return

        if (pendingCompletion != null) {
            cancelCompletion(pendingCompletion!!)
            pendingCompletion = null
        }
        hideCompletions(editor)
    }

    private fun isInjectedFile(editor: Editor): Boolean {
        val psiFile = runReadAction { PsiDocumentManager.getInstance(project).getPsiFile(editor.document) }
        if (psiFile == null) {
            return false
        }
        val response = runReadAction { psiFile.isInjectedText() }
        return response
    }

    private fun hideCompletions(editor: Editor) {
        if (isInjectedFile(editor)) return

        editor.inlayModel.getInlineElementsInRange(0, editor.document.textLength).forEach {
            if (it.renderer is CustomElementRenderer) {
                it.dispose()
            }
        }
        editor.inlayModel.getBlockElementsInRange(0, editor.document.textLength).forEach {
            if (it.renderer is MultilineCustomElementRenderer) {
                it.dispose()
            }
        }
    }
}
