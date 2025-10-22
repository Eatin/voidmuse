package com.voidmuse.idea.plugin.editor;

import com.google.common.collect.Lists;
import com.intellij.openapi.Disposable;
import com.intellij.openapi.command.WriteCommandAction;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.LogicalPosition;
import com.intellij.openapi.editor.colors.EditorFontType;
import com.intellij.openapi.editor.colors.TextAttributesKey;
import com.intellij.openapi.editor.markup.HighlighterLayer;
import com.intellij.openapi.editor.markup.RangeHighlighter;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.TextRange;
import com.intellij.ui.JBColor;
import com.intellij.util.ui.UIUtil;
import com.voidmuse.idea.plugin.editor.custom.CustomButton;
import com.voidmuse.idea.plugin.util.EditorUtils;
import org.apache.commons.collections.CollectionUtils;

import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

/**
 * @author zhangdaguan
 */
public class VerticalDiffBlock {
    private final Editor editor;
    private final Project project;
    private int startLine;
    private final OnAcceptRejectCallback onAcceptReject;
    private final List<String> deletedLines = new ArrayList<>();
    private final List<String> addedLines = new ArrayList<>();
    private final JComponent acceptButton;
    private final JComponent rejectButton;
    private List<Disposable> deletionInlays = null;
    private JTextArea textArea = null;
    private final EditorComponentInlaysManager editorComponentInlaysManager;
    private final TextAttributesKey greenKey;

    public VerticalDiffBlock(Editor editor, Project project, int startLine, OnAcceptRejectCallback onAcceptReject) {
        this.editor = editor;
        this.project = project;
        this.startLine = startLine;
        this.onAcceptReject = onAcceptReject;
        this.editorComponentInlaysManager = EditorComponentInlaysManager.from(editor, false);
        this.greenKey = EditorUtils.createTextAttributesKey("VOID_MUSE_DIFF_NEW_LINE", 0x3000FF00, editor);
        deletionInlays = Lists.newArrayList();

        JComponent[] buttons = createButtons();
        this.acceptButton = buttons[0];
        this.rejectButton = buttons[1];
    }

    public void clearEditorUI() {
        if (deletionInlays != null && CollectionUtils.isNotEmpty(deletionInlays)) {
            for(Disposable deletionInlay: deletionInlays){
                deletionInlay.dispose();
            }
            deletionInlays.clear();
        }
        removeGreenHighlighters();
        removeButtons();
    }

    public void updatePosition(int newLineNumber) {
        this.startLine = newLineNumber;

        refreshEditor();
    }

    public void deleteLineAt(int line) {
        int startOffset = editor.getDocument().getLineStartOffset(line);
        int endOffset = editor.getDocument().getLineEndOffset(line) + 1;
        String deletedText = editor.getDocument().getText(new TextRange(startOffset, endOffset));

        deletedLines.add(deletedText);

        editor.getDocument().deleteString(startOffset, endOffset);
    }

    public void addNewLine(String text, int line) {
        if (line == editor.getDocument().getLineCount()) {
            editor.getDocument().insertString(editor.getDocument().getTextLength(), "\n");
        }

        int offset = editor.getDocument().getLineStartOffset(line);
        editor.getDocument().insertString(offset, text + "\n");
        editor.getMarkupModel().addLineHighlighter(greenKey, line, HighlighterLayer.LAST);

        addedLines.add(text);
    }

    public void onLastDiffLine() {
        if (!deletedLines.isEmpty()) {
            renderDeletedLinesInlay();
        }
        renderButtons();
    }

    public void handleReject() {
        revertDiff();
        clearEditorUI();
    }

    private void refreshEditor() {
        editor.getContentComponent().revalidate();
        editor.getContentComponent().repaint();
    }

    private void renderDeletedLinesInlay() {
        JTextArea textArea = createDeletionTextArea(String.join("\n", deletedLines));
        this.textArea = textArea;

        Disposable disposable = editorComponentInlaysManager.insert(startLine, textArea, false, 0);
        deletionInlays.add(disposable);
    }

    private void renderButtons() {
        // 创建一个面板
        JPanel panel = new JPanel();
        panel.setOpaque(false);

        // 设置布局管理器，居右对齐，并设置水平间隔为 5 像素
        panel.setLayout(new FlowLayout(FlowLayout.RIGHT, 5, 0)); // 5 像素的水平间隔，垂直间隔为 0
        panel.add(rejectButton);
        panel.add(acceptButton);
        Disposable disposable = editorComponentInlaysManager.insert(startLine, panel, false, 0);
        deletionInlays.add(disposable);

        refreshEditor();
    }

    private JComponent[] createButtons() {
        Font editorFont = editor.getColorsScheme().getFont(EditorFontType.PLAIN);
        int fontSize = Math.max(4, editorFont.getSize() - 1);
        Font font = UIUtil.getFontWithFallback("Arial", Font.PLAIN, fontSize);
        CustomButton rejectBtn = new CustomButton(" Reject ", font, () -> {
            handleReject();
            onAcceptReject.onAcceptReject(this, false);
        });
        rejectBtn.setBackground(new JBColor(0x99FF0000, 0x99FF0000));
        rejectBtn.setForeground(new JBColor(0xF5F5F5, 0xF5F5F5));

        CustomButton acceptBtn = new CustomButton(" Accept ", font, () -> {
            handleAccept();
            onAcceptReject.onAcceptReject(this, true);
        });
        acceptBtn.setBackground(new JBColor(0x9900FF00, 0x9900FF00));
        acceptBtn.setForeground(new JBColor(0xF5F5F5, 0xF5F5F5));

        return new JComponent[]{acceptBtn, rejectBtn};
    }

    private void removeButtons() {

        refreshEditor();
    }

    private void handleAccept() {
        clearEditorUI();
    }

    private void revertDiff() {
        WriteCommandAction.runWriteCommandAction(project, () -> {
            // Delete the added lines
            int startOffset = editor.getDocument().getLineStartOffset(startLine);
            int endOffset = editor.getDocument().getLineEndOffset(startLine + addedLines.size() - 1) + 1;
            editor.getDocument().deleteString(startOffset, endOffset);

            // Add the deleted lines back
            if (!deletedLines.isEmpty()) {
                editor.getDocument().insertString(startOffset, String.join("", deletedLines));
            }
        });
    }

    private void removeGreenHighlighters() {
        List<RangeHighlighter> highlightersToRemove = new ArrayList<>();
        for (RangeHighlighter highlighter : editor.getMarkupModel().getAllHighlighters()) {
            int highlighterLine = editor.getDocument().getLineNumber(highlighter.getStartOffset());
            if (highlighterLine >= startLine && highlighterLine < startLine + addedLines.size()) {
                highlightersToRemove.add(highlighter);
            }
        }

        for (RangeHighlighter highlighter : highlightersToRemove) {
            editor.getMarkupModel().removeHighlighter(highlighter);
        }
    }

    private JTextArea createDeletionTextArea(String text) {
        JTextArea textArea = new JTextArea(text);
        textArea.setEditable(false);
        textArea.setBackground(new JBColor(0x30FF0000, 0x30FF0000));
        textArea.setForeground(JBColor.GRAY);
        textArea.setBorder(BorderFactory.createEmptyBorder());
        textArea.setLineWrap(false);
        textArea.setWrapStyleWord(false);
        //idea 默认编辑器字体 jetBrains Mono不支持中文显示，会输出乱码，所以用其他字体代替
        Font editorFont = editor.getColorsScheme().getFont(EditorFontType.PLAIN);
        textArea.setFont(UIUtil.getFontWithFallback("Fira Code", Font.PLAIN, editorFont.getSize()));
        return textArea;
    }

    private Point getButtonsXYPositions() {
        Rectangle visibleArea = editor.getScrollingModel().getVisibleArea();
        int textAreaHeight = (textArea != null) ? textArea.getHeight() : 0;
        Point lineStartPosition = editor.logicalPositionToXY(new LogicalPosition(startLine, 0));

        int xPosition = visibleArea.x + visibleArea.width - acceptButton.getPreferredSize().width - rejectButton.getPreferredSize().width - 20;
//        int yPosition = lineStartPosition.y - textAreaHeight;
        int yPosition = lineStartPosition.y;

        return new Point(xPosition, yPosition);
    }

    private JButton createButton(String text, JBColor backgroundColor) {
        JButton button = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(backgroundColor);
                g2.fillRoundRect(0, 0, getWidth() - 1, getHeight() - 1, 8, 8);
                super.paintComponent(g2);
                g2.dispose();
            }
        };

        button.setForeground(JBColor.WHITE);
        button.setFont(new Font("Arial", Font.PLAIN, 13));
        button.setContentAreaFilled(false);
        button.setOpaque(false);
        button.setBorder(null);
        button.setPreferredSize(new Dimension(button.getPreferredSize().width, 16));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));

        return button;
    }

    public interface OnAcceptRejectCallback {
        void onAcceptReject(VerticalDiffBlock block, boolean isAccepted);
    }


    public int getStartLine() {
        return startLine;
    }

    public List<String> getDeletedLines() {
        return deletedLines;
    }

    public List<String> getAddedLines() {
        return addedLines;
    }
}

