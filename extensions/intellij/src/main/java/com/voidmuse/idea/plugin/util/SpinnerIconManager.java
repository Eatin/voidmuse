package com.voidmuse.idea.plugin.util;

import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.markup.HighlighterTargetArea;
import com.intellij.openapi.editor.markup.MarkupModel;
import com.intellij.openapi.editor.markup.RangeHighlighter;
import com.intellij.openapi.editor.markup.GutterIconRenderer;
import com.intellij.ui.AnimatedIcon;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.util.Objects;

public class SpinnerIconManager {

    private static final Icon SPINNER_ICON = new AnimatedIcon.Default();

    public static void showSpinnerIcon(Editor editor, int lineNumber) {
        if (editor == null) {
            return;
        }

        Document document = editor.getDocument();
        int startOffset = document.getLineStartOffset(lineNumber);
        int endOffset = document.getLineEndOffset(lineNumber);

        MarkupModel markupModel = editor.getMarkupModel();
        for (RangeHighlighter highlighter : markupModel.getAllHighlighters()) {
            if (highlighter.getGutterIconRenderer() != null &&
                    Objects.equals(SPINNER_ICON, highlighter.getGutterIconRenderer().getIcon())) {
                markupModel.removeHighlighter(highlighter);
            }
        }
        RangeHighlighter highlighter = markupModel.addRangeHighlighter(
                startOffset,
                endOffset,
                0, // Layer
                null, // TextAttributes
                HighlighterTargetArea.LINES_IN_RANGE
        );
        highlighter.setGutterIconRenderer(new GutterIconRenderer() {
            @Override
            public @NotNull Icon getIcon() {
                return SPINNER_ICON;
            }

            @Override
            public boolean equals(Object obj) {
                return obj == this;
            }

            @Override
            public int hashCode() {
                return System.identityHashCode(this);
            }
        });
    }

    public static void hideSpinnerIcon(Editor editor) {
        if (editor == null) {
            return;
        }
        MarkupModel markupModel = editor.getMarkupModel();
        for (RangeHighlighter highlighter : markupModel.getAllHighlighters()) {
            if (highlighter.getGutterIconRenderer() != null &&
                    Objects.equals(SPINNER_ICON, highlighter.getGutterIconRenderer().getIcon())) {
                markupModel.removeHighlighter(highlighter);
            }
        }
    }
}
