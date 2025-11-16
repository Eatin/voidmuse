package com.voidmuse.idea.plugin.editor;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.LogicalPosition;
import com.intellij.openapi.editor.SelectionModel;
import com.intellij.openapi.editor.event.SelectionEvent;
import com.intellij.openapi.editor.event.SelectionListener;
import com.intellij.openapi.fileEditor.FileDocumentManager;
import com.intellij.openapi.fileEditor.FileEditor;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.fileEditor.TextEditor;
import com.intellij.openapi.project.DumbAware;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.voidmuse.idea.plugin.util.EditorUtils;
import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.List;

/**
 * @author zhangdaguan
 */
public class PluginSelectionListener implements SelectionListener, DumbAware {
    private final List<ToolTipComponent> toolTipComponents = new ArrayList<>();
    private Editor lastActiveEditor = null;
    private Debouncer debouncer;

    public PluginSelectionListener() {
        this.debouncer = new Debouncer(100);
    }

    @Override
    public void selectionChanged(@NotNull SelectionEvent e) {
//        handleSelection(e);
        debouncer.debounce(() -> handleSelection(e));
    }

    protected void removeAllTooltips() {
        ApplicationManager.getApplication().invokeLater(() -> {
            for (ToolTipComponent toolTipComponent : toolTipComponents) {
                toolTipComponent.getParent().remove(toolTipComponent);
            }
            toolTipComponents.clear();
        });
    }

    protected void handleSelection(SelectionEvent e) {
        ApplicationManager.getApplication().runReadAction(() -> {
            Editor editor = e.getEditor();

            if (editor == null || editor.getProject() == null) {
                return;
            }

            // 将UI操作调度到EDT线程
            ApplicationManager.getApplication().invokeLater(() -> {
                if (!isFileEditor(editor)) {
                    removeAllTooltips();
                    return;
                }

                if (editor != lastActiveEditor) {
                    removeAllTooltips();
                    lastActiveEditor = editor;
                }

                SelectionModel model = editor.getSelectionModel();
                String selectedText = model.getSelectedText();

                if (shouldRemoveTooltip(selectedText, editor)) {
                    removeExistingTooltips(editor, null);
                    return;
                }

                updateTooltip(editor);
            });
        });
    }

    private Boolean isFileEditor(Editor editor) {
        if (editor == null || editor.getProject() == null) {
            return false;
        }
        
        // 确保在EDT线程中执行UI操作
        if (!ApplicationManager.getApplication().isDispatchThread()) {
            return false;
        }
        
        Project project = editor.getProject();
        VirtualFile virtualFile = FileDocumentManager.getInstance().getFile(editor.getDocument());

        if (virtualFile == null || !virtualFile.isInLocalFileSystem()) {
            return false;
        }

        try {
            FileEditorManager fileEditorManager = FileEditorManager.getInstance(project);
            FileEditor fileEditor = fileEditorManager.getSelectedEditor(virtualFile);
            return fileEditor instanceof TextEditor;
        } catch (Exception e) {
            // 如果发生异常，返回false以避免崩溃
            return false;
        }
    }

    private boolean shouldRemoveTooltip(String selectedText, Editor editor) {
        return selectedText == null || selectedText.isEmpty() ||
                EditorUtils.isTerminal(editor);
    }


    private void removeExistingTooltips(Editor editor, Runnable onComplete) {
        ApplicationManager.getApplication().invokeLater(() -> {
            for (ToolTipComponent toolTipComponent : toolTipComponents) {
                editor.getContentComponent().remove(toolTipComponent);
            }
            editor.getContentComponent().revalidate();
            editor.getContentComponent().repaint();
            toolTipComponents.clear();
            if (onComplete != null) {
                onComplete.run();
            }
        });
    }

    private void updateTooltip(Editor editor) {
        removeExistingTooltips(editor, () -> ApplicationManager.getApplication().invokeLater(() -> {
            LogicalPosition cursorPosition = editor.getCaretModel().getLogicalPosition();
            int tooltipX = editor.logicalPositionToXY(cursorPosition).x;
            int tooltipY = editor.logicalPositionToXY(cursorPosition).y;
            //位置再偏上一点
            tooltipY -= editor.getLineHeight();
            int min = editor.logicalPositionToXY(new LogicalPosition(0, 0)).y + editor.getLineHeight();
            tooltipY = Math.max(min, tooltipY);
            addToolTipComponent(editor, tooltipX, tooltipY);
        }));
    }


    private void addToolTipComponent(Editor editor, int tooltipX, int selectionTopY) {
        ToolTipComponent toolTipComponent = new ToolTipComponent(editor, tooltipX, selectionTopY);
        toolTipComponents.add(toolTipComponent);
        editor.getContentComponent().add(toolTipComponent);
        editor.getContentComponent().revalidate();
        editor.getContentComponent().repaint();
    }
}

