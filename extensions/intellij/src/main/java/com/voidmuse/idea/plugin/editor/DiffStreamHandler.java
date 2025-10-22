package com.voidmuse.idea.plugin.editor;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.command.WriteCommandAction;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.colors.TextAttributesKey;
import com.intellij.openapi.editor.markup.HighlighterLayer;
import com.intellij.openapi.editor.markup.RangeHighlighter;
import com.intellij.openapi.project.Project;
import com.voidmuse.idea.plugin.editor.diff.DiffLine;
import com.voidmuse.idea.plugin.editor.diff.DiffLineType;
import com.voidmuse.idea.plugin.editor.diff.TextDiff;
import com.voidmuse.idea.plugin.util.EditorUtils;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class DiffStreamHandler {
    private static final Logger LOG = Logger.getInstance(DiffStreamHandler.class);
    private final Project project;
    private final Editor editor;
    private final int startLine;
    private final int endLine;
    private final Runnable onClose;
    private final Runnable onFinish;

    private CurLineState curLine;
    private boolean isRunning = false;

    private final List<RangeHighlighter> unfinishedHighlighters = new ArrayList<>();
    private final List<VerticalDiffBlock> diffBlocks = new ArrayList<>();

    private final TextAttributesKey curLineKey;
    private final TextAttributesKey unfinishedKey;

    private static class CurLineState {
        int index;
        RangeHighlighter highlighter = null;
        VerticalDiffBlock diffBlock = null;

        CurLineState(int index) {
            this.index = index;
        }
    }

    public DiffStreamHandler(Project project, Editor editor, int startLine, int endLine, Runnable onClose, Runnable onFinish) {
        this.project = project;
        this.editor = editor;
        this.startLine = startLine;
        this.endLine = endLine;
        this.onClose = onClose;
        this.onFinish = onFinish;
        this.curLine = new CurLineState(startLine);

        this.curLineKey = EditorUtils.createTextAttributesKey("VOID_MUSE_DIFF_CURRENT_LINE", 0x40888888, editor);
        this.unfinishedKey = EditorUtils.createTextAttributesKey("VOID_MUSE_DIFF_UNFINISHED_LINE", 0x20888888, editor);

        initUnfinishedRangeHighlights();
    }

    public void acceptAll() {
        editor.getMarkupModel().removeAllHighlighters();
        resetState();
    }

    public void rejectAll() {
        for (VerticalDiffBlock block : new ArrayList<>(diffBlocks)) {
            block.handleReject();
            handleDiffBlockAcceptOrReject(block, false);
        }

        resetState();
    }

    private void initUnfinishedRangeHighlights() {
        for (int i = startLine; i <= endLine; i++) {
            RangeHighlighter highlighter = editor.getMarkupModel().addLineHighlighter(
                    unfinishedKey, Math.min(i, editor.getDocument().getLineCount() - 1), HighlighterLayer.LAST
            );
            unfinishedHighlighters.add(highlighter);
        }
    }

    private void handleDiffLine(DiffLineType type, String text) {
        try {
            if (!isRunning) {
                LOG.error("get handle input while not running, type:{}, line:{}", String.valueOf(type), text);
                return;
            }

            switch (type) {
                case SAME:
                    handleSameLine();
                    break;
                case NEW:
                    handleNewLine(text);
                    break;
                case OLD:
                    handleOldLine();
                    break;
            }

            updateProgressHighlighters(type);

        } catch (Exception e) {
            System.out.println("Error handling diff line: " + curLine.index + ", " + type + ", " + text + ", " + e.getMessage());
        }
    }

    private void handleDiffBlockAcceptOrReject(VerticalDiffBlock diffBlock, boolean didAccept) {
        diffBlocks.remove(diffBlock);

        if (!didAccept) {
            updatePositionsOnReject(diffBlock.getStartLine(), diffBlock.getAddedLines().size(), diffBlock.getDeletedLines().size());
        }

        if (diffBlocks.isEmpty()) {
            onClose.run();
        }
    }

    private VerticalDiffBlock createDiffBlock() {
        VerticalDiffBlock diffBlock = new VerticalDiffBlock(editor, project, curLine.index, this::handleDiffBlockAcceptOrReject);
        diffBlocks.add(diffBlock);
        return diffBlock;
    }

    private void handleSameLine() {
        if (curLine.diffBlock != null) {
            curLine.diffBlock.onLastDiffLine();
        }

        curLine.diffBlock = null;
        curLine.index++;
    }

    private void handleNewLine(String text) {
        if (curLine.diffBlock == null) {
            curLine.diffBlock = createDiffBlock();
        }

        curLine.diffBlock.addNewLine(text, curLine.index);
        curLine.index++;
    }

    private void handleOldLine() {
        if (curLine.diffBlock == null) {
            curLine.diffBlock = createDiffBlock();
        }
        curLine.diffBlock.deleteLineAt(curLine.index);
    }

    private void updateProgressHighlighters(DiffLineType type) {
        if (curLine.highlighter != null) {
            editor.getMarkupModel().removeHighlighter(curLine.highlighter);
        }
        curLine.highlighter = editor.getMarkupModel().addLineHighlighter(
                curLineKey, Math.min(curLine.index, editor.getDocument().getLineCount() - 1), HighlighterLayer.LAST
        );

        if (type != DiffLineType.OLD && !unfinishedHighlighters.isEmpty()) {
            editor.getMarkupModel().removeHighlighter(unfinishedHighlighters.remove(0));
        }
    }

    private void updatePositionsOnReject(int startLine, int numAdditions, int numDeletions) {
        int offset = -numAdditions + numDeletions;

        for (VerticalDiffBlock block : diffBlocks) {
            if (block.getStartLine() > startLine) {
                block.updatePosition(block.getStartLine() + offset);
            }
        }
    }

    private void resetState() {
        editor.getMarkupModel().removeAllHighlighters();
        for (VerticalDiffBlock block : diffBlocks) {
            block.clearEditorUI();
        }

        diffBlocks.clear();
        curLine = new CurLineState(startLine);
        isRunning = false;
        onClose.run();
    }

    private void handleFinishedResponse() {
        //防止最后的输出没打印
        WriteCommandAction.runWriteCommandAction(project, () -> handleSameLine());

        onFinish.run();
        ApplicationManager.getApplication().invokeLater(this::cleanupProgressHighlighters);
    }

    private void cleanupProgressHighlighters() {
        if (curLine.highlighter != null) {
            editor.getMarkupModel().removeHighlighter(curLine.highlighter);
        }
        for (RangeHighlighter highlighter : unfinishedHighlighters) {
            editor.getMarkupModel().removeHighlighter(highlighter);
        }
    }

    public void sleepMs(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 处理外部传入的diff结果并展示
     * @param filePath 文件路径（用于日志和调试）
     * @param originalCode 原始代码
     * @param modifiedCode 修改后的代码
     */
    public void handleExternalDiffResult(String filePath, String originalCode, String modifiedCode) {
        LOG.info("Handling external diff result for file: " + filePath);
        isRunning = true;
        
        List<String> oldLines = Arrays.asList(originalCode.split("\n"));
        List<String> newLines = Arrays.asList(modifiedCode.split("\n"));
        
        TextDiff textDiff = new TextDiff(oldLines, newLines);
        List<DiffLine> diffLines = textDiff.genDiffLines();
        LOG.info("oldLines: " + originalCode);
        LOG.info("newLines: " + modifiedCode);
        LOG.info("diffLines: " + diffLines.toString());

        
        ApplicationManager.getApplication().invokeLater(() -> {
            for (DiffLine diffLine : diffLines) {
                WriteCommandAction.runWriteCommandAction(project, () -> {
                    handleDiffLine(diffLine.type(), diffLine.line());
                });
                sleepMs(20);
            }
            handleFinishedResponse();
        });
    }
}

