package com.voidmuse.idea.plugin.activity;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectManagerListener;
import com.intellij.ui.jcef.JBCefBrowser;
import com.voidmuse.idea.plugin.codebase.vector.LuceneVectorStore;
import com.voidmuse.idea.plugin.service.ProjectBeanService;
import org.jetbrains.annotations.NotNull;

/**
 * @author zhangdaguan
 */
public class PluginProjectManagerListener implements ProjectManagerListener {
    @Override
    public void projectClosed(@NotNull Project project) {
        JBCefBrowser browser = ProjectBeanService.getInstance(project).getBrowser();
        if (browser != null) {
            browser.getJBCefClient().dispose();
            browser.dispose();
        }

        LuceneVectorStore.getInstance(project).close();
    }
}
