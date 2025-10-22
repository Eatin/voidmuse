package com.voidmuse.idea.plugin.editor;

import com.intellij.openapi.Disposable;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.ex.EditorEx;
import com.intellij.openapi.editor.impl.EditorEmbeddedComponentManager;
import com.intellij.openapi.editor.impl.EditorImpl;
import com.intellij.openapi.editor.impl.view.FontLayoutService;
import com.intellij.openapi.util.Disposer;
import com.intellij.openapi.util.Key;
import com.intellij.ui.components.JBScrollPane;
import com.intellij.util.concurrency.annotations.RequiresEdt;
import com.intellij.util.ui.JBUI;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.util.HashMap;
import java.util.Map;


public class EditorComponentInlaysManager implements Disposable {

    private final EditorImpl editor;
    private final boolean onlyOneInlay;
    private final Map<ComponentWrapper, Disposable> managedInlays = new HashMap<>();
    private final EditorTextWidthWatcher editorWidthWatcher;
    private boolean isDisposed;

    public EditorComponentInlaysManager(EditorImpl editor, boolean onlyOneInlay) {
        this.editor = editor;
        this.onlyOneInlay = onlyOneInlay;
        this.editorWidthWatcher = new EditorTextWidthWatcher();

        editor.getScrollPane().getViewport().addComponentListener(editorWidthWatcher);
        Disposer.register(this, () -> editor.getScrollPane().getViewport().removeComponentListener(editorWidthWatcher));
    }

    @RequiresEdt
    public Disposable insert(int lineIndex, JComponent component, boolean addToStart, int setOffset) {
        if (isDisposed) return null;

        if (onlyOneInlay) {
            managedInlays.values().forEach(Disposer::dispose);
        }

        ComponentWrapper wrappedComponent = new ComponentWrapper(component);
        int offset = editor.getDocument().getLineEndOffset(lineIndex) + setOffset;
        if (addToStart) {
            offset = editor.getDocument().getLineStartOffset(lineIndex) + setOffset;
        }

        EditorEmbeddedComponentManager.Properties properties = new EditorEmbeddedComponentManager.Properties(
                EditorEmbeddedComponentManager.ResizePolicy.none(),
                null,
                true,
                true,
                0,
                offset
        );

        Disposable disposable = EditorEmbeddedComponentManager.getInstance().addComponent(editor, wrappedComponent, properties);
        if (disposable != null) {
            managedInlays.put(wrappedComponent, disposable);
            Disposer.register(disposable, () -> managedInlays.remove(wrappedComponent));
        }
        return disposable;
    }

    @Override
    public void dispose() {
        isDisposed = true;
        managedInlays.values().forEach(Disposer::dispose);
    }

    private class ComponentWrapper extends JBScrollPane {
        private final JComponent component;

        public ComponentWrapper(JComponent component) {
            super(component);
            this.component = component;
            setOpaque(false);
            getViewport().setOpaque(false);

            setBorder(JBUI.Borders.empty());
            setViewportBorder(JBUI.Borders.empty());

            setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
            getVerticalScrollBar().setPreferredSize(new Dimension(0, 0));
            setViewportView(component);

            component.addComponentListener(new ComponentAdapter() {
                @Override
                public void componentResized(ComponentEvent e) {
                    dispatchEvent(new ComponentEvent(component, ComponentEvent.COMPONENT_RESIZED));
                }
            });
        }

        @Override
        public Dimension getPreferredSize() {
            return new Dimension(editor.getContentComponent().getWidth(), component.getPreferredSize().height);
        }
    }

    private class EditorTextWidthWatcher extends ComponentAdapter {
        private int editorTextWidth = 0;
        private final int maximumEditorTextWidth;
        private final boolean verticalScrollbarFlipped;

        public EditorTextWidthWatcher() {
            FontMetrics metrics = editor.getFontMetrics(Font.PLAIN);
            float spaceWidth = FontLayoutService.getInstance().charWidth2D(metrics, ' ');
            maximumEditorTextWidth = (int) Math.ceil(spaceWidth * (editor.getSettings().getRightMargin(editor.getProject())) - 4);

            Object scrollbarFlip = editor.getScrollPane().getClientProperty(JBScrollPane.Flip.class);
            verticalScrollbarFlipped = scrollbarFlip == JBScrollPane.Flip.HORIZONTAL || scrollbarFlip == JBScrollPane.Flip.BOTH;
        }

        @Override
        public void componentResized(ComponentEvent e) {
            updateWidthForAllInlays();
        }

        @Override
        public void componentHidden(ComponentEvent e) {
            updateWidthForAllInlays();
        }

        @Override
        public void componentShown(ComponentEvent e) {
            updateWidthForAllInlays();
        }

        private void updateWidthForAllInlays() {
            int newWidth = calcWidth();
            if (editorTextWidth == newWidth) return;
            editorTextWidth = newWidth;

            managedInlays.keySet().forEach(it -> {
                it.dispatchEvent(new ComponentEvent(it, ComponentEvent.COMPONENT_RESIZED));
                it.invalidate();
            });
        }

        private int calcWidth() {
            int visibleEditorTextWidth = editor.getScrollPane().getViewport().getWidth() - getVerticalScrollbarWidth() - getGutterTextGap();
            return Math.min(Math.max(visibleEditorTextWidth, 0), maximumEditorTextWidth);
        }

        private int getVerticalScrollbarWidth() {
            int width = editor.getScrollPane().getVerticalScrollBar().getWidth();
            return !verticalScrollbarFlipped ? width * 2 : width;
        }

        private int getGutterTextGap() {
            if (verticalScrollbarFlipped) {
                EditorEx editorEx = editor;
                return editorEx.getGutterComponentEx().getWidth() - editorEx.getGutterComponentEx().getWhitespaceSeparatorOffset();
            }
            return 0;
        }
    }

    public static final Key<EditorComponentInlaysManager> INLAYS_KEY = Key.create("EditorComponentInlaysManager");

    public static EditorComponentInlaysManager from(Editor editor, boolean onlyOneInlay) {
        synchronized (editor) {
            EditorComponentInlaysManager manager = editor.getUserData(INLAYS_KEY);
            if (manager == null) {
                EditorComponentInlaysManager newManager = new EditorComponentInlaysManager((EditorImpl) editor, false);
                editor.putUserData(INLAYS_KEY, newManager);
                return newManager;
            } else {
                return manager;
            }
        }
    }
}

