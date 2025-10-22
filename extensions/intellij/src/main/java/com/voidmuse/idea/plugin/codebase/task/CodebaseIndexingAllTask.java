package com.voidmuse.idea.plugin.codebase.task;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.progress.EmptyProgressIndicator;
import com.intellij.openapi.progress.ProgressIndicator;
import com.intellij.openapi.progress.ProgressManager;
import com.intellij.openapi.progress.Task;
import com.intellij.openapi.progress.impl.BackgroundableProcessIndicator;
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
import org.jetbrains.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CodebaseIndexingAllTask extends Task.Backgroundable {

    private static final Logger LOG = Logger.getInstance(CodebaseIndexingAllTask.class);
    private final Project project;
    private final List<CheckedFile> checkedFiles;
    private final EmbeddingsService embeddingsService;
    private final boolean showProgress;
    private static final Map<Project, Boolean> taskStatusMap = new ConcurrentHashMap<>();
    private static final Map<Project, Double> taskIndicatorValueMap = new ConcurrentHashMap<>();

    public CodebaseIndexingAllTask(Project project, String title, List<CheckedFile> checkedFiles, boolean showProgress) {
        super(project, title, true);
        this.project = project;
        this.checkedFiles = checkedFiles;
        this.showProgress = showProgress;
        this.embeddingsService = EmbeddingsService.getInstance(project);
    }

    public static boolean isProjectRunning(Project project) {
        return taskStatusMap.getOrDefault(project, false);
    }

    public static long countAnyProjectRunning() {
        return taskStatusMap.values().stream().filter(status -> status).count();
    }

    public void run() {
        if (taskStatusMap.getOrDefault(project, false)) {
            LOG.warn("Another indexing task is already running for this project. Ignoring the current request.");
            return;
        }
        taskStatusMap.put(project, true);
        //EmptyProgressIndicator不显示进度条
        if (showProgress) {
            ProgressManager.getInstance()
                    .runProcessWithProgressAsynchronously(this, new BackgroundableProcessIndicator(this));
        } else {
            ProgressManager.getInstance()
                    .runProcessWithProgressAsynchronously(this, new EmptyProgressIndicator());
        }
    }

    private volatile boolean cancelled = false;

    @Override
    public void onCancel() {
        cancelled = true;
        LOG.info("Indexing task cancelled by user");
    }

    @Override
    public void run(@NotNull ProgressIndicator indicator) {
        LOG.info("Indexing started");

        if (!FileUtil.exists(VoidMusePlugin.getIndexStorePath())) {
            FileUtils.tryCreateDirectory(VoidMusePlugin.getIndexStorePath());
        }
        if (!FileUtil.exists(VoidMusePlugin.getProjectIndexStorePath(project))) {
            FileUtils.tryCreateDirectory(VoidMusePlugin.getProjectIndexStorePath(project));
        }

        try {
            indicator.setFraction(0);
            List<Word> embeddings = createEmbeddings(checkedFiles, indicator);
            LuceneVectorStore.getInstance(project).saveAll(embeddings);

            project.getMessageBus()
                    .syncPublisher(CodebaseIndexingCompletedNotifier.INDEXING_COMPLETED_TOPIC)
                    .indexingCompleted();
        } catch (Throwable e) {
            LOG.warn("Something went wrong while indexing the codebase", e);

            project.getMessageBus()
                    .syncPublisher(CodebaseIndexingCompletedNotifier.INDEXING_COMPLETED_TOPIC)
                    .indexingCompleted();
        } finally {
            taskStatusMap.put(project, false);
            // 强制停止进度条
            stopProgressIndicatorSafely(indicator);
        }
    }

    /**
     * 安全停止进度条的方法
     */
    private void stopProgressIndicatorSafely(ProgressIndicator indicator) {
        try {
            if (indicator != null) {
                // 先取消任务
                indicator.cancel();

                // 等待一小段时间让取消操作生效
                Thread.sleep(100);

                // 强制停止
                if (indicator.isRunning()) {
                    indicator.stop();
                }

                // 重置进度显示
                indicator.setFraction(0);
            }
        } catch (Exception e) {
            LOG.warn("Error while stopping progress indicator", e);
            // 即使停止进度条出错，也不影响主流程
        }
    }


    public List<Word> createEmbeddings(List<CheckedFile> checkedFiles, @Nullable ProgressIndicator indicator) {
        var words = new ArrayList<Word>();
        for (int i = 0; i < checkedFiles.size(); i++) {
            // 检查取消状态
            if (cancelled || (indicator != null && indicator.isCanceled())) {
                LOG.info("Embedding creation cancelled");
                break;
            }
            try {
                var checkedFile = checkedFiles.get(i);
                embeddingsService.addEmbeddingsToList(checkedFile, words);
                double indicatorValue = (double) i / checkedFiles.size();
                if (indicator != null) {
                    indicator.setFraction(indicatorValue);
                }
                taskIndicatorValueMap.put(project, indicatorValue);
            } catch (Throwable t) {
                LOG.error("createEmbeddings error, ", t);
            }
        }
        taskIndicatorValueMap.put(project, 1.0);
        return words;
    }

    public static Double getProjectIndicatorValue(Project project) {
        if (taskIndicatorValueMap.containsKey(project)) {
            return taskIndicatorValueMap.get(project);
        } else if (LuceneVectorStore.getInstance(project).isIndexExists()) {
            return 1.0;
        }
        return 0.0;
    }
}
