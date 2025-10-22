package com.voidmuse.idea.plugin.codebase.task;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.progress.EmptyProgressIndicator;
import com.intellij.openapi.progress.ProgressIndicator;
import com.intellij.openapi.progress.ProgressManager;
import com.intellij.openapi.progress.Task;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.io.FileUtil;
import com.voidmuse.idea.plugin.VoidMusePlugin;
import com.voidmuse.idea.plugin.codebase.CodebaseIndexingCompletedNotifier;
import com.voidmuse.idea.plugin.codebase.embedding.CheckedFile;
import com.voidmuse.idea.plugin.codebase.embedding.EmbeddingsService;
import com.voidmuse.idea.plugin.codebase.vector.LuceneVectorStore;
import com.voidmuse.idea.plugin.codebase.vector.Word;
import com.voidmuse.idea.plugin.util.FileUtils;
import org.jetbrains.annotations.NotNull;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CodebaseUpdateFileTask extends Task.Backgroundable {

    private static final Logger LOG = Logger.getInstance(CodebaseUpdateFileTask.class);
    private final Project project;
    private final List<CheckedFile> addFiles;
    private final List<String> removeFilePaths;
    private final EmbeddingsService embeddingsService;
    private final boolean checkSingle;
    private static final Map<Project, Boolean> taskStatusMap = new ConcurrentHashMap<>();

    public CodebaseUpdateFileTask(Project project, String title, List<CheckedFile> addFiles, List<String> removeFilePaths, boolean checkSingle) {
        super(project, title, checkSingle);
        this.project = project;
        this.addFiles = addFiles;
        this.removeFilePaths = removeFilePaths;
        this.checkSingle = checkSingle;
        this.embeddingsService = EmbeddingsService.getInstance(project);
    }

    public static boolean isProjectRunning(Project project) {
        return taskStatusMap.getOrDefault(project, false);
    }

    public static long countAnyProjectRunning() {
        return taskStatusMap.values().stream().filter(status -> status).count();
    }

    public void run() {
        if (checkSingle) {
            if (taskStatusMap.getOrDefault(project, false)) {
                LOG.warn("Another indexing task is already running for this project. Ignoring the current request.");
                return;
            }
            taskStatusMap.put(project, true);
        }
        //EmptyProgressIndicator不显示进度条
        ProgressManager.getInstance()
                .runProcessWithProgressAsynchronously(this, new EmptyProgressIndicator());
    }

    @Override
    public void run(@NotNull ProgressIndicator indicator) {
        LOG.info("update Index started");
        if (!FileUtil.exists(VoidMusePlugin.getIndexStorePath())) {
            FileUtils.tryCreateDirectory(VoidMusePlugin.getIndexStorePath());
        }
        if (!FileUtil.exists(VoidMusePlugin.getProjectIndexStorePath(project))) {
            FileUtils.tryCreateDirectory(VoidMusePlugin.getProjectIndexStorePath(project));
        }

        try {
            indicator.setFraction(0);
            List<Word> wordList = embeddingsService.createEmbeddingsAndAddToLucene(addFiles, indicator);
            LuceneVectorStore.getInstance(project).updateIndex(wordList, removeFilePaths);

            project.getMessageBus()
                    .syncPublisher(CodebaseIndexingCompletedNotifier.INDEXING_COMPLETED_TOPIC)
                    .indexingCompleted();
        } catch (Exception e) {
            LOG.warn("Something went wrong while indexing the codebase", e);
        } finally {
            if (checkSingle) {
                taskStatusMap.put(project, false);
            }
            if (indicator.isRunning()) {
                indicator.stop();
            }
        }
    }
}
