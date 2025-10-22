package com.voidmuse.idea.plugin.util;

import com.google.common.collect.Maps;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.SelectionModel;
import com.intellij.openapi.editor.colors.TextAttributesKey;
import com.intellij.openapi.editor.markup.TextAttributes;
import com.intellij.openapi.util.TextRange;
import com.intellij.ui.JBColor;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

public class EditorUtils {

    public static boolean isTerminal(Editor editor) {
        return editor.getClass().getName().contains("Terminal");
    }

    public static TextAttributesKey createTextAttributesKey(String name, int color, Editor editor) {
        TextAttributes attributes = new TextAttributes();
        attributes.setBackgroundColor(new JBColor(color, color));

        TextAttributesKey key = TextAttributesKey.createTextAttributesKey(name);
        editor.getColorsScheme().setAttributes(key, attributes);

        return key;
    }

    public static String getPluginGlobalPath() throws Exception {
        Path pluginPath = Paths.get(System.getProperty("user.home"), ".VoidMuse");
        if (Files.notExists(pluginPath)) {
            Files.createDirectories(pluginPath);
        }
        return pluginPath.toString();
    }

    public static Map<String, String> getSelectText(Editor editor) {
        Map<String, String> result = Maps.newHashMap();
        SelectionModel selectionModel = editor.getSelectionModel();
        int startOffset = selectionModel.getSelectionStart();
        int endOffset = selectionModel.getSelectionEnd();
        int startLineNumber = editor.getDocument().getLineNumber(startOffset);
        int endLineNumber = editor.getDocument().getLineNumber(endOffset);
        String realSelected = editor.getDocument().getText(new TextRange(startOffset, endOffset));
        //修正，选满一行
        startOffset = editor.getDocument().getLineStartOffset(startLineNumber);
        endOffset = editor.getDocument().getLineEndOffset(endLineNumber);
        String prefix = editor.getDocument().getText(new TextRange(0, startOffset));
        String selected = editor.getDocument().getText(new TextRange(startOffset, endOffset));
        String suffix = editor.getDocument().getText(new TextRange(endOffset, editor.getDocument().getTextLength()));
        result.put("prefix", prefix);
        result.put("selected", selected);
        result.put("realSelected", realSelected);
        result.put("suffix", suffix);
        //从0开始算，给前端显示要加1
        result.put("startLineNumber", String.valueOf(startLineNumber + 1));
        result.put("endLineNumber", String.valueOf(endLineNumber + 1));
        return result;
    }
}
