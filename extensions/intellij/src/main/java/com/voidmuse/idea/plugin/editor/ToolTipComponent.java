package com.voidmuse.idea.plugin.editor;

import com.intellij.openapi.actionSystem.KeyboardShortcut;
import com.intellij.openapi.actionSystem.Shortcut;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.keymap.Keymap;
import com.intellij.openapi.keymap.KeymapManager;
import com.intellij.openapi.keymap.KeymapUtil;
import com.intellij.ui.components.JBPanel;
import org.apache.commons.lang3.StringUtils;

import java.awt.*;
import java.awt.event.ActionEvent;
import java.util.Locale;

/**
 * @author zhangdaguan
 */
public class ToolTipComponent extends JBPanel<ToolTipComponent> {
    private final StyledButton addToChatButton;
    private final StyledButton editButton;

    public ToolTipComponent(Editor editor, int x, int y) {
        setLayout(null); // Remove the FlowLayout
        setOpaque(false);
        setBackground(new Color(0, 0, 0, 0));

        String cmdCtrlChar = System.getProperty("os.name").toLowerCase(Locale.getDefault()).contains("mac") ? "⌘" : "Ctrl+";

        int buttonHeight = 24;
        int buttonHorizontalPadding = 0;
        int buttonVerticalPadding = 8;
        int componentHorizontalPadding = 2;
        int buttonMargin = 0;

        String addToChatShortcutText = getShortcutText("com.voidmuse.idea.plugin.editor.ToggleToolWindowAction");
        addToChatShortcutText = StringUtils.isBlank(addToChatShortcutText) ? cmdCtrlChar + "Y" : addToChatShortcutText;
        addToChatButton = new StyledButton("Chat " + addToChatShortcutText);

        String editChatShortcutText = getShortcutText("com.voidmuse.idea.plugin.editor.InlineEditAction");
        editChatShortcutText = StringUtils.isBlank(editChatShortcutText) ? cmdCtrlChar + "U" : editChatShortcutText;
        editButton = new StyledButton("Edit " + editChatShortcutText);

        addToChatButton.addActionListener((ActionEvent e) -> {
            ToggleToolWindowAction.toggleMyToolWindow(editor.getProject(), editor);
            editor.getContentComponent().remove(this);
        });

        editButton.addActionListener((ActionEvent e) -> {
            InlineEditAction.openInlineEdit(editor.getProject(), editor);
            editor.getContentComponent().remove(this);
        });

        // Calculate button widths
        int addToChatWidth = addToChatButton.getPreferredSize().width + (2 * buttonHorizontalPadding);
        int editWidth = editButton.getPreferredSize().width + (2 * buttonHorizontalPadding);

        // Set bounds for buttons
        addToChatButton.setBounds(componentHorizontalPadding, buttonVerticalPadding, addToChatWidth, buttonHeight);
        editButton.setBounds(componentHorizontalPadding + addToChatWidth + buttonMargin - 4, buttonVerticalPadding, editWidth, buttonHeight);

        add(addToChatButton);
        add(editButton);

        int totalWidth = addToChatWidth + editWidth + buttonMargin + (2 * componentHorizontalPadding);
        int totalHeight = buttonHeight + (2 * buttonVerticalPadding);

        // Center the component on the provided y coordinate
        int yPosition = y - (totalHeight / 2);
        setBounds(x, yPosition, totalWidth, totalHeight);
    }


    /**
     * 获取指定 actionId 的快捷键文本
     *
     * @param actionId Action 的 ID
     * @return 快捷键的文本表示（如 "Ctrl+N"）
     */
    public static String getShortcutText(String actionId) {
        // 获取当前 Keymap
        Keymap keymap = KeymapManager.getInstance().getActiveKeymap();

        // 获取 Action 的所有快捷键
        Shortcut[] shortcuts = keymap.getShortcuts(actionId);

        // 遍历快捷键，找到键盘快捷键
        for (Shortcut shortcut : shortcuts) {
            if (shortcut instanceof KeyboardShortcut) {
                // 将快捷键转换为文本
                return KeymapUtil.getShortcutText(shortcut);
            }
        }
        // 如果没有找到快捷键，返回空字符串
        return "";
    }
}

