package com.voidmuse.idea.plugin.autocomplete

import com.intellij.openapi.actionSystem.DataContext
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.Caret
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.actionSystem.EditorAction
import com.intellij.openapi.editor.actionSystem.EditorActionHandler

class TriggerAutocompleteAction : EditorAction(object : EditorActionHandler() {
    override fun doExecute(editor: Editor, caret: Caret?, dataContext: DataContext?) {
        ApplicationManager.getApplication().runWriteAction {
            editor.project?.service<AutocompleteService>()?.triggerCompletion(editor)
        }
    }
})

