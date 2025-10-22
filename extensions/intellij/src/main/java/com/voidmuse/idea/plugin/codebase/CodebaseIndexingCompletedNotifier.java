package com.voidmuse.idea.plugin.codebase;

import com.intellij.util.messages.Topic;

public interface CodebaseIndexingCompletedNotifier {

    Topic<CodebaseIndexingCompletedNotifier> INDEXING_COMPLETED_TOPIC =
            Topic.create("codebaseIndexingCompleted", CodebaseIndexingCompletedNotifier.class);

    void indexingCompleted();
}
