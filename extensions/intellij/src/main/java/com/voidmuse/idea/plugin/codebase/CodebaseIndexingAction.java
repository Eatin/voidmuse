package com.voidmuse.idea.plugin.codebase;

import com.intellij.icons.AllIcons;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.DialogBuilder;
import com.intellij.ui.components.JBLabel;
import com.intellij.util.ui.JBFont;
import com.intellij.util.ui.JBUI;
import com.voidmuse.idea.plugin.codebase.task.CodebaseIndexingAllTask;
import org.jetbrains.annotations.NotNull;

import static com.intellij.openapi.ui.DialogWrapper.OK_EXIT_CODE;

public class CodebaseIndexingAction extends AnAction {

    public CodebaseIndexingAction() {
        super("[Codebase] Update Indexes", "Codebase update indexes", AllIcons.Actions.Refresh);
    }

    @Override
    public void actionPerformed(@NotNull AnActionEvent event) {
        var project = event.getProject();
        if (project != null) {
            var folderStructureTreePanel = new FolderStructureTreePanel(project);
            var show = showFileStructureDialog(project, folderStructureTreePanel);
            if (show == OK_EXIT_CODE) {
                new CodebaseIndexingAllTask(project, "manual indexing codebase", folderStructureTreePanel.getCheckedFiles(), true).run();
            }
        }
    }

    public static int showFileStructureDialog(Project project, FolderStructureTreePanel folderStructureTreePanel) {
        var dialogBuilder = new DialogBuilder(project);
        dialogBuilder.setNorthPanel(JBUI.Panels.simplePanel(new JBLabel(
                        "<html>" +
                                "<p>Indexing files enables direct queries related to your codebase.</p>" +
                                "<br/>" +
                                "<p>File index saves locally on your computer; no files are sent to any 3rd party services.</p>" +
                                "</html>")
                        .setCopyable(true)
                        .setAllowAutoWrapping(true)
                        .withFont(JBFont.medium()))
                .withBorder(JBUI.Borders.emptyBottom(12)));
        dialogBuilder.setCenterPanel(folderStructureTreePanel.getPanel());
        dialogBuilder.addOkAction().setText("Start Indexing");
        dialogBuilder.addCancelAction();
        dialogBuilder.setTitle("Choose Files for Indexing");
        return dialogBuilder.show();
    }
}
