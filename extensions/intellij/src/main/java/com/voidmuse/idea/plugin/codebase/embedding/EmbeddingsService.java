package com.voidmuse.idea.plugin.codebase.embedding;

import static com.voidmuse.idea.plugin.util.VectorUtils.normalize;
import static java.util.stream.Collectors.toList;

import cn.hutool.json.JSONUtil;
import com.google.common.collect.Lists;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.progress.ProgressIndicator;

import java.util.*;
import java.util.concurrent.*;

import com.intellij.openapi.project.Project;
import com.voidmuse.idea.plugin.codebase.vector.LuceneVectorStore;
import com.voidmuse.idea.plugin.codebase.vector.Word;
import com.voidmuse.idea.plugin.service.CallJavaScriptService;
import com.voidmuse.idea.plugin.service.FileService;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.Nullable;
import cn.hutool.core.codec.Base64;

@Service(Service.Level.PROJECT)
public final class EmbeddingsService {

    private static final Logger LOG = Logger.getInstance(EmbeddingsService.class);
    private final Project project;

    public EmbeddingsService(Project project) {
        this.project = project;
    }

    public static EmbeddingsService getInstance(Project project) {
        return project.getService(EmbeddingsService.class);
    }

    public List<double[]> getEmbeddings(List<ChunkFileInfo> chunks) {
        if (CollectionUtils.isEmpty(chunks)) {
            return Lists.newArrayList();
        }

        try {
            Map<String, Object> paramMap = new HashMap<>();
            List<String> encodeMessages = chunks.stream()
                    .map(chunk -> Base64.encode(chunk.getContent())).toList();
            paramMap.put("input", encodeMessages);

            CompletableFuture<List<double[]>> future = new CompletableFuture<>();

            CallJavaScriptService.getInstance(project).callJavaScriptAsync(
                    "getEmbeddings", paramMap, new CallJavaScriptService.Callback() {
                        @Override
                        public void run(Map<String, Object> args) {
                            try {
                                String data = args.get("data").toString();
                                List<double[]> embeddings = JSONUtil.parseArray(data).stream()
                                        .map(obj -> ((List<Number>) obj).stream()
                                                .mapToDouble(Number::doubleValue)
                                                .toArray())
                                        .collect(toList());
                                future.complete(embeddings);
                            } catch (Exception e) {
                                LOG.error("Error processing embedding result", e);
                                future.completeExceptionally(e);
                            }
                        }

                        @Override
                        public void timeout() {
                            LOG.warn("Embedding request timeout");
                            future.complete(Lists.newArrayList());
                        }
                    }
            );

            // 直接使用future的timeout机制
            return future.get(30, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            LOG.warn("Embedding request timed out after 30 seconds");
            return Lists.newArrayList();
        } catch (Exception e) {
            LOG.error("getEmbeddings error, ", e);
        }
        return Lists.newArrayList();
    }


    public double[] getEmbedding(String chunk) {
        List<double[]> result = getEmbeddings(Lists.newArrayList(new ChunkFileInfo(chunk, 0, 0)));
        if (CollectionUtils.isNotEmpty(result)) {
            return result.get(0);
        }
        return new double[0];
    }

    private String sanitizeJsonString(String input) {
        if (StringUtils.isBlank(input)) {
            return input;
        }

        // 先尝试移除Markdown代码块标记
        String cleaned = input.replaceAll("^\\s*```\\s*json\\s*", "")
                .replaceAll("\\s*```\\s*$", "");

        // 如果还是无法解析，尝试提取JSON对象
        try {
            JSONUtil.parseObj(cleaned);
            return cleaned;
        } catch (Exception e) {
            // 提取JSON内容
            int start = input.indexOf("{");
            int end = input.lastIndexOf("}") + 1;

            if (start >= 0 && end > start) {
                return input.substring(start, end);
            }
        }

        // 如果以上方法都失败，返回原始输入
        return input;
    }


    // 修改buildWithCodebaseContext方法使用Lucene混合搜索
    public List<FindNearFileInfo> buildWithCodebaseContext(String prompt, String optimizePrompt) {
        if (StringUtils.isBlank(prompt) || !LuceneVectorStore.getInstance(project).isIndexExists()) {
            return Lists.newArrayList();
        }
        try {
            // 解析优化后的提示
            String sanitizedJson = sanitizeJsonString(optimizePrompt);
            OptimizeCodebasePromptResult optimizeResult = JSONUtil.toBean(sanitizedJson, OptimizeCodebasePromptResult.class);
            String queryPrompt = StringUtils.isNotBlank(optimizeResult.getPrompt()) ? optimizeResult.getPrompt() : prompt;

            // 获取嵌入向量
            double[] queryEmbedding = getEmbedding(queryPrompt);

            // 计算文本查询权重和向量查询权重
            float textWeight = 0.3f;  // 可以根据实际需求调整或从配置中读取
            float vectorWeight = 0.7f;

            // 获取最大结果数
            int maxK = 50;

            // 执行混合搜索
            List<FindNearFileInfo> results = LuceneVectorStore.getInstance(project)
                    .hybridSearch(queryPrompt, queryEmbedding, textWeight, vectorWeight, maxK);

            // 处理结果
            FileService fileService = FileService.getInstance(project);
            List<FindNearFileInfo> processedResults = new ArrayList<>();
            for (FindNearFileInfo info : results) {
                String content = fileService.getFileContentRange(info.getPath(), info.getStartLine(), info.getEndLine());
                if (StringUtils.isNotBlank(content)) {
                    // Base64编码内容
                    info.setContent(Base64.encode(content));
                    processedResults.add(info);
                }
            }

            return processedResults;
        } catch (Exception e) {
            LOG.error("buildWithCodebaseContext error", e);
        }
        return Lists.newArrayList();
    }

    // 创建嵌入并添加到Lucene索引
    public List<Word> createEmbeddingsAndAddToLucene(List<CheckedFile> checkedFiles, @Nullable ProgressIndicator indicator) {
        List<Word> words = new ArrayList<>();
        for (int i = 0; i < checkedFiles.size(); i++) {
            try {
                var checkedFile = checkedFiles.get(i);
                addEmbeddingsToList(checkedFile, words);

                if (indicator != null) {
                    indicator.setFraction((double) i / checkedFiles.size());
                }
            } catch (Throwable t) {
                LOG.error("createEmbeddings error, ", t);
            }
        }
        return words;
    }

    // 添加嵌入到列表
    public void addEmbeddingsToList(CheckedFile checkedFile, List<Word> words) {
        if (StringUtils.isBlank(checkedFile.getFileContent())) {
            return;
        }

        // 分割文件内容为块
        Random random = new Random();
        int randomLines = 35 + random.nextInt(31);
        List<ChunkFileInfo> chunks = splitText(checkedFile.getFileContent(), randomLines);

        // 获取嵌入向量
        List<double[]> embeddings = new ArrayList<>();
        Lists.partition(chunks, 1).forEach(list -> {
            List<double[]> result = getEmbeddings(list);
            if (CollectionUtils.isNotEmpty(result)) {
                embeddings.addAll(result);
            }
        });

        if (CollectionUtils.isEmpty(embeddings)) {
            return;
        }

        if (embeddings.size() != chunks.size()) {
            LOG.warn("embedding size not equal chunk size, checkedFile:" + checkedFile.getFileName());
            return;
        }

        // 创建Word对象
        for (int i = 0; i < chunks.size(); i++) {
            Integer startLine = chunks.get(i).getStartLine();
            Integer endLine = chunks.get(i).getEndLine();
            ChunkMetaInfo metaInfo = new ChunkMetaInfo(checkedFile.getFilePath(), startLine, endLine);
            words.add(new Word(
                    checkedFile.getFilePath() + "--" + startLine + "--" + endLine,
                    JSONUtil.toJsonStr(metaInfo),
                    normalize(embeddings.get(i))
            ));
        }
    }

    private static List<ChunkFileInfo> splitText(String str, int maxLinesPerChunk) {
        var chunks = new ArrayList<ChunkFileInfo>();
        var lines = str.split("\r?\n");
        var currentChunk = new StringBuilder();

        int lineCounter = 0;
        int chunkStartLine = 0;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            if (lineCounter < maxLinesPerChunk) {
                currentChunk.append(line).append("\n");
                lineCounter++;
            } else {
                chunks.add(new ChunkFileInfo(currentChunk.toString(), chunkStartLine + 1, i));
                currentChunk = new StringBuilder(line).append("\n");
                chunkStartLine = i;
                lineCounter = 1;
            }
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(new ChunkFileInfo(currentChunk.toString(), chunkStartLine + 1, lines.length));
        }
        return chunks;
    }

}
