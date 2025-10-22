package com.voidmuse.idea.plugin.codebase;

import com.google.common.collect.Lists;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectUtil;
import com.intellij.openapi.vcs.changes.ChangeListManager;
import com.intellij.openapi.vcs.changes.VcsIgnoreManager;
import com.intellij.openapi.vfs.VirtualFile;
import com.voidmuse.idea.plugin.codebase.embedding.CheckedFile;
import com.voidmuse.idea.plugin.codebase.task.CodebaseIndexingAllTask;
import com.voidmuse.idea.plugin.codebase.task.CodebaseUpdateFileTask;
import com.voidmuse.idea.plugin.codebase.vector.LuceneVectorStore;
import com.voidmuse.idea.plugin.service.FileService;
import com.voidmuse.idea.plugin.service.ProjectScheduledService;
import com.voidmuse.idea.plugin.util.StateUtils;
import org.apache.commons.collections.CollectionUtils;
import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * @author zhangdaguan
 */
@Service(Service.Level.PROJECT)
public final class CheckAutoIndexingTask {
    private static final Logger LOG = Logger.getInstance(CheckAutoIndexingTask.class);
    private final Project project;
    private VcsIgnoreManager ignoreManager;
    private ChangeListManager changeListManager;

    public CheckAutoIndexingTask(Project project) {
        this.project = project;
    }

    public static CheckAutoIndexingTask getInstance(Project project) {
        return project.getService(CheckAutoIndexingTask.class);
    }


    public void startCheckAll() {
        ProjectScheduledService.getInstance(project).scheduleAtFixedRate(this::checkAutoIndexAll, 10, 15, TimeUnit.SECONDS);
    }

    public void checkAutoIndexAll() {
        if (!StateUtils.getCodebaseAutoIndexing()) {
            return;
        }
        LuceneVectorStore vectorStore = LuceneVectorStore.getInstance(project);
        if (CodebaseIndexingAllTask.isProjectRunning(project) ||
                CodebaseUpdateFileTask.isProjectRunning(project) ||
                CodebaseIndexingAllTask.countAnyProjectRunning() > 2 ||
                CodebaseUpdateFileTask.countAnyProjectRunning() > 3) {
            return;
        }
        if (ignoreManager == null) {
            ignoreManager = VcsIgnoreManager.getInstance(project);
        }
        if (changeListManager == null) {
            changeListManager = ChangeListManager.getInstance(project);
        }
        //开始建立全局索引
        var projectDirectory = ProjectUtil.guessProjectDir(project);
        List<CheckedFile> fileList = Lists.newArrayList();
        if (projectDirectory != null) {
            traverseDirectory(fileList, projectDirectory);
        }
        int totalSize = fileList.size();
        //已经建立索引的，也忽略
        fileList = fileList.stream().filter(file -> !vectorStore.hasIndex(file.getFilePath()))
                .toList();
        if (CollectionUtils.isNotEmpty(fileList)) {
            if (vectorStore.isIndexExists()) {
                //限制每次的fileList的最大数量为100
                if (fileList.size() > 100) {
                    fileList = fileList.subList(0, 100);
                }

                //检查脏数据
                List<String> removeFiles = vectorStore.queryNotExistFilePaths();
                //增量更新
                new CodebaseUpdateFileTask(project, "task check auto update codebase", fileList, removeFiles, true).run();
            } else {
                //限制每次的fileList的最大数量
//                int maxSize = Math.min(300, totalSize / 2);
//                if (fileList.size() > maxSize) {
//                    fileList = fileList.subList(0, maxSize);
//                }
                //全量更新
                new CodebaseIndexingAllTask(project, "auto indexing codebase", fileList, true).run();
            }
        }
    }

    private void traverseDirectory(@NotNull List<CheckedFile> fileList, @NotNull VirtualFile projectDirectory) {
        for (VirtualFile childFile : projectDirectory.getChildren()) {
            if (isIgnoreFile(childFile)) {
                continue;
            }

            if (childFile.isDirectory()) {
                traverseDirectory(fileList, childFile);
            } else if (!changeListManager.isIgnoredFile(childFile) &&
                    !ignoreManager.isPotentiallyIgnoredFile(childFile) &&
                    childFile.getLength() > 0 &&
                    childFile.getLength() < Math.pow(1024, 2)) {
                fileList.add(new CheckedFile(new File(childFile.getPath())));
            }
        }
    }

    private boolean isIgnoreFile(VirtualFile childFile) {
        return FileService.getInstance(project).isCodeBaseIgnoreFile(childFile);
    }
}
