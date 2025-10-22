package com.voidmuse.idea.plugin.editor;

import cn.hutool.core.codec.Base64;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.PlatformDataKeys;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowManager;
import com.voidmuse.idea.plugin.service.CallJavaScriptService;
import com.voidmuse.idea.plugin.util.EditorUtils;
import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;
import java.util.Map;

public class ToggleToolWindowAction extends AnAction {
    private static final Logger LOG = Logger.getInstance(ToggleToolWindowAction.class);

    @Override
    public void actionPerformed(AnActionEvent e) {
        Editor editor = e.getData(PlatformDataKeys.EDITOR);
        Project project = e.getData(PlatformDataKeys.PROJECT);
        if (editor != null && project != null) {
            toggleMyToolWindow(project, editor);
        }
    }

    public static void toggleMyToolWindow(Project project, Editor editor) {
        ToolWindow toolWindow = ToolWindowManager.getInstance(project).getToolWindow("VoidMuse");
        if (toolWindow != null) {
            ApplicationManager.getApplication().invokeLater(() -> {
                Map<String, String> selectedMap = EditorUtils.getSelectText(editor);
                String prefix = selectedMap.get("prefix");
                String selected = selectedMap.get("selected");
                String suffix = selectedMap.get("suffix");
                if (StringUtils.isNotBlank(selectedMap.get("realSelected"))) {
                    //add to chat after toggle tool window
                    toolWindow.show(() -> {
                        //转移焦点
                        toolWindow.getComponent().requestFocus();
                        Map<String, Object> args = new HashMap<>();
                        args.put("prefix", Base64.encode(prefix));
                        args.put("suffix", Base64.encode(suffix));
                        args.put("selected", Base64.encode(selected));
                        args.put("startLineNumber", selectedMap.get("startLineNumber"));
                        args.put("endLineNumber", selectedMap.get("endLineNumber"));
                        args.put("filePath", editor.getVirtualFile().getPath());
                        args.put("fileName", editor.getVirtualFile().getName());
                        //send command to web js  add to chat
                        CallJavaScriptService.getInstance(project).callJavaScript(project, "addToChat", args);
                        editor.getSelectionModel().removeSelection();
                    });

                } else {
                    if (toolWindow.isVisible()) {
                        toolWindow.hide();
                    } else {
                        toolWindow.show(null);
                    }
                }
            });
        }
    }

    public static void closeToolWindow(Project project) {
        ToolWindow toolWindow = ToolWindowManager.getInstance(project).getToolWindow("VoidMuse");
        if (toolWindow != null) {
            ApplicationManager.getApplication().invokeLater(() -> {
                if (toolWindow.isVisible()) {
                    toolWindow.hide();
                }
            });
        }
    }


}
