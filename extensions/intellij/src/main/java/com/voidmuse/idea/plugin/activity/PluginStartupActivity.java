package com.voidmuse.idea.plugin.activity;

import com.intellij.openapi.Disposable;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.EditorFactory;
import com.intellij.openapi.project.DumbAware;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.startup.StartupActivity;
import com.intellij.openapi.vfs.VirtualFileManager;
import com.voidmuse.idea.plugin.codebase.CheckAutoIndexingTask;
import com.voidmuse.idea.plugin.codebase.CodeBaseFileListener;
import com.voidmuse.idea.plugin.codebase.vector.LuceneVectorStore;
import com.voidmuse.idea.plugin.editor.PluginSelectionListener;
import com.voidmuse.idea.plugin.service.FileService;

import java.util.concurrent.CompletableFuture;

/**
 * @author zhangdaguan
 */
public class PluginStartupActivity implements StartupActivity, Disposable, DumbAware {
    private static final Logger LOG = Logger.getInstance(PluginStartupActivity.class);

    @Override
    public void runActivity(Project project) {
        initializePlugin(project);
    }

    private void initializePlugin(Project project) {
        CompletableFuture.runAsync(() -> {
            PluginSelectionListener listener = new PluginSelectionListener();
            EditorFactory.getInstance().getEventMulticaster().addSelectionListener(listener, this);

            //注册文件监听
            project.getMessageBus().connect().subscribe(VirtualFileManager.VFS_CHANGES, new CodeBaseFileListener(project));

            try {
                FileService.getInstance(project).startCacheUpdater();

                //初始化索引
                LuceneVectorStore.getInstance(project).startCacheIndex();
                CheckAutoIndexingTask.getInstance(project).startCheckAll();
            } catch (Exception e) {
                LOG.error("Failed to initializePlugin", e);
            }
        });
    }


    @Override
    public void dispose() {

    }
}
