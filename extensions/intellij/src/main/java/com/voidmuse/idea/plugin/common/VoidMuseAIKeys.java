package com.voidmuse.idea.plugin.common;

import com.intellij.openapi.util.Key;

public class VoidMuseAIKeys {

    public static final Key<String> PREVIOUS_INLAY_TEXT =
            Key.create("voidMuse.editor.inlay.prev-value");
    public static final Key<Integer> FETCHING_COMPLETION_LINE_NUMBER =
            Key.create("voidMuse.fetchingCompletionLineNumber");
    public static final Key<String> REMAINING_EDITOR_COMPLETION =
            Key.create("voidMuse.editorCompletionLines");
    public static final Key<Boolean> IS_FETCHING_COMPLETION =
            Key.create("voidMuse.isFetchingCompletion");
    public static final Key<Boolean> IS_GENERATING_GIT_COMMIT =
            Key.create("voidMuse.isGeneratingGitCommit");
}
