package com.voidmuse.idea.plugin.codebase;

import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.openapi.vfs.newvfs.BulkFileListener;
import com.intellij.openapi.vfs.newvfs.events.VFileContentChangeEvent;
import com.intellij.openapi.vfs.newvfs.events.VFileCreateEvent;
import com.intellij.openapi.vfs.newvfs.events.VFileDeleteEvent;
import com.intellij.openapi.vfs.newvfs.events.VFileEvent;
import com.voidmuse.idea.plugin.codebase.embedding.CheckedFile;
import com.voidmuse.idea.plugin.codebase.task.CodebaseIndexingAllTask;
import com.voidmuse.idea.plugin.codebase.task.CodebaseUpdateFileTask;
import com.voidmuse.idea.plugin.codebase.vector.LuceneVectorStore;
import com.voidmuse.idea.plugin.service.FileService;
import com.voidmuse.idea.plugin.service.ProjectScheduledService;
import com.voidmuse.idea.plugin.util.StateUtils;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * @author zhangdaguan
 */
public class CodeBaseFileListener implements BulkFileListener {
    private final Project project;
    private Set<String> updateFiles = Sets.newHashSet();
    private Set<String> removeFiles = Sets.newHashSet();
    private long lastUpdateTime = System.currentTimeMillis();

    public CodeBaseFileListener(Project project) {
        this.project = project;

        ProjectScheduledService.getInstance(project).scheduleAtFixedRate(this::updateFileIndex, 5, 10, TimeUnit.SECONDS);
    }

    @Override
    public void after(@NotNull List<? extends VFileEvent> events) {
        if (!StateUtils.getCodebaseAutoIndexing()) {
            return;
        }
        String basePath = project.getBasePath();
        FileService fileService = FileService.getInstance(project);

        for (VFileEvent event : events) {
            VirtualFile virtualFile = event.getFile();
            if (virtualFile == null || !virtualFile.getPath().contains(basePath) || fileService.isCodeBaseIgnoreFile(virtualFile)) {
                continue;
            }
            if (event instanceof VFileCreateEvent) {
                // 文件创建事件
                updateFiles.add(Objects.requireNonNull(event.getFile()).getPath());
            } else if (event instanceof VFileDeleteEvent) {
                // 文件删除事件
                removeFiles.add(Objects.requireNonNull(event.getFile()).getPath());
            } else if (event instanceof VFileContentChangeEvent) {
                // 文件内容更改事件
                updateFiles.add(Objects.requireNonNull(event.getFile()).getPath());
            }
        }
        lastUpdateTime = System.currentTimeMillis();
    }

    public void updateFileIndex() {
        //持续改变保持一定间隔和积累一定文件再一起更新
        boolean intervalCheck = System.currentTimeMillis() - lastUpdateTime > 10 * 1000;
        if (!intervalCheck) {
            return;
        }
        if (updateFiles.isEmpty() && removeFiles.isEmpty()) {
            return;
        }
        if (!LuceneVectorStore.getInstance(project).isIndexExists()) {
            return;
        }
        //降低并发
        if (CodebaseIndexingAllTask.isProjectRunning(project) ||
                CodebaseUpdateFileTask.isProjectRunning(project) ||
                CodebaseIndexingAllTask.countAnyProjectRunning() > 1 ||
                CodebaseUpdateFileTask.countAnyProjectRunning() > 2) {
            return;
        }
        List<String> addFiles = Lists.newArrayList(updateFiles);
        List<String> delFiles = Lists.newArrayList(removeFiles);
        updateFiles = Sets.newHashSet();
        removeFiles = Sets.newHashSet();
        //更新索引任务
        List<CheckedFile> addIndexFiles = addFiles.stream()
                .map(path -> new CheckedFile(new File(path)))
                .filter(file -> StringUtils.isNotBlank(file.getFileContent())).toList();
        if (CollectionUtils.isNotEmpty(addIndexFiles) || CollectionUtils.isNotEmpty(delFiles)) {
            new CodebaseUpdateFileTask(project, "file change auto update codebase", addIndexFiles, delFiles, false).run();
        }
    }
}
