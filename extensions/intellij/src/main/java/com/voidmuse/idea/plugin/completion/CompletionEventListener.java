package com.voidmuse.idea.plugin.completion;

/**
 * @author zhangdaguan
 */
public interface CompletionEventListener {
    default void onOpen() {
    }

    default void onEvent(String data) {
    }

    default void onComplete(StringBuilder messageBuilder) {
    }

    default void onCancelled(StringBuilder messageBuilder) {
    }

    default void onError(String message, Throwable ex) {
    }
}
