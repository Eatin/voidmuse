package com.voidmuse.idea.plugin.codebase.vector;

import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.io.FileUtil;
import com.voidmuse.idea.plugin.VoidMusePlugin;
import com.voidmuse.idea.plugin.codebase.embedding.ChunkMetaInfo;
import com.voidmuse.idea.plugin.codebase.embedding.FindNearFileInfo;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.*;
import org.apache.lucene.index.*;
import org.apache.lucene.search.*;
import org.apache.lucene.index.LeafReaderContext;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.queryparser.classic.ParseException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.ByteBuffer;

@Service(Service.Level.PROJECT)
public final class LuceneVectorStore {
    private static final Logger LOG = Logger.getInstance(LuceneVectorStore.class);
    private final Project project;
    private final Directory directory;
    private final StandardAnalyzer analyzer;
    private IndexWriter indexWriter;
    // lucene的knn查找默认最大支持为1024，更高的维度需要额外配置系统变量
    private static final int VECTOR_DIMENSION = 1024;
    private static final int curVersion = 1;
    private final String storePath;

    /**
     * 向量搜索权重
     */
    private static final float VECTOR_SEARCH_WEIGHT = 0.7f;

    public LuceneVectorStore(Project project) {
        this.project = project;
        this.storePath = getIndexStorePath(VoidMusePlugin.getProjectIndexStorePath(project), curVersion);

        try {
            Path indexPath = Paths.get(storePath);
            File indexDir = new File(indexPath.toString());
            if (!indexDir.exists()) {
                indexDir.mkdirs();
            }
            this.directory = FSDirectory.open(indexPath);
            this.analyzer = new StandardAnalyzer();
            IndexWriterConfig config = new IndexWriterConfig(analyzer);
            config.setOpenMode(IndexWriterConfig.OpenMode.CREATE_OR_APPEND);
            this.indexWriter = new IndexWriter(directory, config);
        } catch (IOException e) {
            LOG.error("Failed to initialize Lucene index", e);
            throw new RuntimeException("Failed to initialize Lucene store", e);
        }
    }

    public static LuceneVectorStore getInstance(Project project) {
        return project.getService(LuceneVectorStore.class);
    }

    /**
     * 将float数组转换为字节数组
     */
    private byte[] floatToByteArray(float[] floatArray) {
        ByteBuffer buffer = ByteBuffer.allocate(floatArray.length * 4);
        for (float f : floatArray) {
            buffer.putFloat(f);
        }
        return buffer.array();
    }

    /**
     * 将字节数组转换为float数组
     */
    private static float[] byteArrayToFloatArray(byte[] byteArray) {
        ByteBuffer buffer = ByteBuffer.wrap(byteArray);
        float[] floatArray = new float[byteArray.length / 4];
        for (int i = 0; i < floatArray.length; i++) {
            floatArray[i] = buffer.getFloat();
        }
        return floatArray;
    }

    public void startCacheIndex() throws IOException {
        // 检查并清理旧索引文件
        List<String> oldStores = getOldIndexStorePath(VoidMusePlugin.getProjectIndexStorePath(project));
        if (CollectionUtils.isNotEmpty(oldStores)) {
            for (String oldStore : oldStores) {
                if (FileUtil.exists(oldStore)) {
                    FileUtil.delete(new File(oldStore));
                }
            }
        }
    }

    // 调整向量到目标维度
    private double[] padOrTruncateVector(double[] vector, int targetDimension) {
        if (vector.length == targetDimension) {
            return vector;
        }

        double[] result = new double[targetDimension];
        // 复制原始向量的值（取最小长度）
        for (int i = 0; i < Math.min(vector.length, targetDimension); i++) {
            result[i] = vector[i];
        }
        // 如果原始向量较短，剩余位置填充0
        return result;
    }


    /**
     * 添加文档到索引
     */
    public void addDocument(String id, String path, String content, double[] vector, int startLine, int endLine) throws IOException {
        Document doc = new Document();

        //调整向量到目标维度
        vector = padOrTruncateVector(vector, VECTOR_DIMENSION);

        // 添加ID字段
        doc.add(new StringField("id", id, Field.Store.YES));

        // 添加路径字段
        doc.add(new StringField("path", path, Field.Store.YES));

        // 添加文本内容字段 - 用于全文搜索
        doc.add(new TextField("content", content, Field.Store.YES));

        // 添加行号信息
        doc.add(new StoredField("startLine", startLine));
        doc.add(new StoredField("endLine", endLine));

        // 添加文件名，便于搜索
        String fileName = new File(path).getName();
        doc.add(new TextField("fileName", fileName, Field.Store.YES));

        // 添加向量字段 - Lucene 8.x 兼容实现
        float[] floatVector = new float[vector.length];
        for (int i = 0; i < vector.length; i++) {
            floatVector[i] = (float) vector[i];
        }
        // 在Lucene 8.x中，我们将向量存储为二进制字段
        doc.add(new StoredField("vector", floatToByteArray(floatVector)));

        // 添加或更新文档
        indexWriter.updateDocument(new Term("id", id), doc);
    }

    /**
     * 更新索引
     */
    public void updateIndex(List<Word> addWords, List<String> removePaths) throws IOException {
        if (CollectionUtils.isEmpty(addWords) && CollectionUtils.isEmpty(removePaths)) {
            return;
        }

        // 标准化路径
        removePaths = removePaths.stream().map(str -> str.replace("\\", "/")).collect(Collectors.toList());

        // 删除需要移除的文档
        if (CollectionUtils.isNotEmpty(removePaths)) {
            BooleanQuery.Builder queryBuilder = new BooleanQuery.Builder();
            for (String path : removePaths) {
                queryBuilder.add(new TermQuery(new Term("path", path)), BooleanClause.Occur.SHOULD);
            }
            indexWriter.deleteDocuments(queryBuilder.build());
        }

        // 处理要添加的文档
        for (Word word : addWords) {
            ChunkMetaInfo metaInfo = cn.hutool.json.JSONUtil.toBean(word.getMeta(), ChunkMetaInfo.class);
            // 删除现有的相同ID文档
            indexWriter.deleteDocuments(new Term("id", word.id()));

            // 获取内容 - 这里假设您的Word类没有存储原始内容，需要重新读取
            // 如果有存储内容，直接使用即可
            String content = "";
            try {
                content = new String(Files.readAllBytes(Paths.get(metaInfo.getPath())));
                // 提取指定行范围的内容
                if (content != null && metaInfo.getStartLine() > 0 && metaInfo.getEndLine() > 0) {
                    String[] lines = content.split("\r?\n");
                    StringBuilder sb = new StringBuilder();
                    for (int i = metaInfo.getStartLine() - 1; i < Math.min(metaInfo.getEndLine(), lines.length); i++) {
                        sb.append(lines[i]).append("\n");
                    }
                    content = sb.toString();
                }
            } catch (Exception e) {
                LOG.warn("Failed to read file content: " + metaInfo.getPath(), e);
            }

            // 添加新文档
            addDocument(
                    word.id(),
                    metaInfo.getPath(),
                    content,
                    word.vector(),
                    metaInfo.getStartLine(),
                    metaInfo.getEndLine()
            );
        }

        // 提交更改
        indexWriter.commit();
    }

    /**
     * 混合搜索 - 结合文本和向量查询
     */
    public List<FindNearFileInfo> hybridSearch(String textQuery, double[] vectorQuery, float textWeight, float vectorWeight, int k) throws IOException {
        if (textQuery == null && vectorQuery == null) {
            return new ArrayList<>();
        }

        vectorQuery = padOrTruncateVector(vectorQuery, VECTOR_DIMENSION);

        try {
            DirectoryReader reader = DirectoryReader.open(indexWriter);
            IndexSearcher searcher = new IndexSearcher(reader);

            // 准备文本查询
            Query query = null;
            if (StringUtils.isNotBlank(textQuery)) {
                try {
                    QueryParser parser = new QueryParser("content", analyzer);
                    query = parser.parse(textQuery);
                } catch (ParseException e) {
                    LOG.warn("Failed to parse text query: " + textQuery, e);
                    // 降级为简单Term查询
                    query = new TermQuery(new Term("content", textQuery));
                }
            }

            // 准备向量查询 - Lucene 8.x 兼容实现
            Query knnQuery = null;
            if (vectorQuery != null && vectorQuery.length > 0) {
                // 在Lucene 8.x中，我们使用自定义的向量相似度查询
                knnQuery = new VectorSimilarityQuery("vector", vectorQuery, k * 3);
            }

            // 执行混合查询
            List<FindNearFileInfo> results = new ArrayList<>();
            if (query != null && knnQuery != null) {
                // 二阶段混合搜索
                results = twoStageHybridSearch(searcher, query, knnQuery, textWeight, vectorWeight, k);
            } else if (query != null) {
                // 仅文本搜索
                results = textOnlySearch(searcher, query, k);
            } else if (knnQuery != null) {
                // 仅向量搜索
                results = vectorOnlySearch(searcher, knnQuery, k);
            }

            reader.close();
            return results;

        } catch (IOException e) {
            LOG.error("Error during hybrid search", e);
            throw e;
        }
    }

    /**
     * 二阶段混合搜索 - 先分别执行两种查询，然后合并结果
     */
    private List<FindNearFileInfo> twoStageHybridSearch(IndexSearcher searcher, Query textQuery, Query vectorQuery,
                                                        float textWeight, float vectorWeight, int k) throws IOException {
        // 执行文本查询
        TopDocs textResults = searcher.search(textQuery, k * 3);

        // 执行向量查询
        TopDocs vectorResults = searcher.search(vectorQuery, k * 3);

        // 归一化权重
        float totalWeight = textWeight + vectorWeight;
        float normalizedTextWeight = textWeight / totalWeight;
        float normalizedVectorWeight = vectorWeight / totalWeight;

        // 构建文档ID到分数的映射
        Map<Integer, Float> textScores = new HashMap<>();
        float maxTextScore = 0f;
        for (ScoreDoc sd : textResults.scoreDocs) {
            maxTextScore = Math.max(maxTextScore, sd.score);
        }
        if (maxTextScore == 0f) {
            maxTextScore = 1.0f; // 防止除以零
        }
        for (ScoreDoc sd : textResults.scoreDocs) {
            textScores.put(sd.doc, sd.score / maxTextScore);
        }

        Map<Integer, Float> vectorScores = new HashMap<>();
        float maxVectorScore = 0f;
        for (ScoreDoc sd : vectorResults.scoreDocs) {
            maxVectorScore = Math.max(maxVectorScore, sd.score);
        }

        if (maxVectorScore > 0) {
            for (ScoreDoc sd : vectorResults.scoreDocs) {
                vectorScores.put(sd.doc, sd.score / maxVectorScore);
            }
        }

        // 合并结果集
        Set<Integer> allDocs = new HashSet<>();
        allDocs.addAll(textScores.keySet());
        allDocs.addAll(vectorScores.keySet());

        List<ScoredDocument> scoredDocs = new ArrayList<>();
        for (int docId : allDocs) {
            float normalizedTextScore = textScores.getOrDefault(docId, 0f);
            float normalizedVectorScore = vectorScores.getOrDefault(docId, 0f);

            // 计算混合分数
            float hybridScore = normalizedTextWeight * normalizedTextScore + normalizedVectorWeight * normalizedVectorScore;

            scoredDocs.add(new ScoredDocument(docId, hybridScore));
        }

        // 按混合分数排序
        scoredDocs.sort((a, b) -> Float.compare(b.score, a.score));

        // 转换为结果列表
        List<FindNearFileInfo> results = new ArrayList<>();
        for (int i = 0; i < Math.min(k, scoredDocs.size()); i++) {
            ScoredDocument sd = scoredDocs.get(i);
            Document doc = searcher.doc(sd.docId);

            FindNearFileInfo info = new FindNearFileInfo(
                    new File(doc.get("path")).getName(),
                    doc.get("path"),
                    doc.getField("startLine").numericValue().intValue(),
                    doc.getField("endLine").numericValue().intValue()
            );

            info.setContent(doc.get("content"));
            info.setDistance(1.0 - sd.score); // 转换为距离（相似度的补）

            results.add(info);
        }

        return results;
    }

    /**
     * 仅文本搜索
     */
    private List<FindNearFileInfo> textOnlySearch(IndexSearcher searcher, Query query, int k) throws IOException {
        TopDocs results = searcher.search(query, k);
        List<FindNearFileInfo> fileInfos = new ArrayList<>();

        // 计算最大分数
        float maxScore = 0f;
        for (ScoreDoc sd : results.scoreDocs) {
            maxScore = Math.max(maxScore, sd.score);
        }

        // 防止除以零
        if (maxScore == 0f) {
            maxScore = 1.0f;
        }

        for (ScoreDoc sd : results.scoreDocs) {
            Document doc = searcher.doc(sd.doc);

            FindNearFileInfo info = new FindNearFileInfo(
                    new File(doc.get("path")).getName(),
                    doc.get("path"),
                    doc.getField("startLine").numericValue().intValue(),
                    doc.getField("endLine").numericValue().intValue()
            );

            info.setContent(doc.get("content"));
            info.setDistance(1.0 - (sd.score / maxScore)); // 使用计算出的最大分数

            fileInfos.add(info);
        }

        return fileInfos;
    }

    /**
     * 仅向量搜索 - 使用新的 API
     */
    private List<FindNearFileInfo> vectorOnlySearch(IndexSearcher searcher, Query query, int k) throws IOException {
        TopDocs results = searcher.search(query, k);
        List<FindNearFileInfo> fileInfos = new ArrayList<>();

        float maxScore = 0f;
        for (ScoreDoc sd : results.scoreDocs) {
            maxScore = Math.max(maxScore, sd.score);
        }

        for (ScoreDoc sd : results.scoreDocs) {
            Document doc = searcher.doc(sd.doc);

            FindNearFileInfo info = new FindNearFileInfo(
                    new File(doc.get("path")).getName(),
                    doc.get("path"),
                    doc.getField("startLine").numericValue().intValue(),
                    doc.getField("endLine").numericValue().intValue()
            );

            info.setContent(doc.get("content"));
            float normalizedScore = maxScore > 0 ? sd.score / maxScore : 0;
            info.setDistance(1.0 - normalizedScore); // 转换为距离

            fileInfos.add(info);
        }

        return fileInfos;
    }

    /**
     * 检查指定路径的文件是否已被索引
     *
     * @param path 文件路径
     * @return 如果文件已被索引则返回true，否则返回false
     */
    public boolean hasIndex(String path) {
        try {
            DirectoryReader reader = DirectoryReader.open(indexWriter);
            IndexSearcher searcher = new IndexSearcher(reader);

            // 创建查询
            TermQuery query = new TermQuery(new Term("path", path));

            // 执行查询
            TopDocs results = searcher.search(query, 1);

            // 检查是否有匹配结果
            boolean exists = results.scoreDocs.length > 0;

            reader.close();
            return exists;
        } catch (IOException e) {
            LOG.warn("Failed to check if path is indexed: " + path, e);
            return false;
        }
    }

    /**
     * 查询索引中存在但文件系统中不存在的文件路径列表
     *
     * @return 不存在的文件路径列表
     */
    public List<String> queryNotExistFilePaths() {
        List<String> retList = new ArrayList<>();

        try {
            DirectoryReader reader = DirectoryReader.open(indexWriter);
            IndexSearcher searcher = new IndexSearcher(reader);

            // 查询所有文档
            Query query = new MatchAllDocsQuery();
            TopDocs results = searcher.search(query, Integer.MAX_VALUE);

            // 遍历所有文档，检查文件是否存在
            for (ScoreDoc scoreDoc : results.scoreDocs) {
                Document doc = searcher.doc(scoreDoc.doc);
                String path = doc.get("path");

                if (!FileUtil.exists(path)) {
                    retList.add(path);
                }
            }

            reader.close();

            // 去重
            return retList.stream().distinct().collect(Collectors.toList());
        } catch (IOException e) {
            LOG.error("Failed to query non-existent file paths", e);
            return retList;
        }
    }


    /**
     * 检查索引是否存在
     */
    public boolean isIndexExists() {
        try {
            DirectoryReader reader = DirectoryReader.open(directory);
            boolean exists = reader.numDocs() > 0;
            reader.close();
            return exists;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * 批量添加文档
     */
    public void saveAll(List<Word> words) throws IOException {
        // 清空现有索引
        indexWriter.deleteAll();

        // 添加所有文档
        for (Word word : words) {
            ChunkMetaInfo metaInfo = cn.hutool.json.JSONUtil.toBean(word.getMeta(), ChunkMetaInfo.class);
            // 获取内容 - 根据实际情况调整
            String content = "";
            try {
                content = new String(Files.readAllBytes(Paths.get(metaInfo.getPath())));
//                FileUtil.readUtf8String(new File(metaInfo.getPath()));
                // 提取指定行范围的内容
                if (content != null && metaInfo.getStartLine() > 0 && metaInfo.getEndLine() > 0) {
                    String[] lines = content.split("\r?\n");
                    StringBuilder sb = new StringBuilder();
                    for (int i = metaInfo.getStartLine() - 1; i < Math.min(metaInfo.getEndLine(), lines.length); i++) {
                        sb.append(lines[i]).append("\n");
                    }
                    content = sb.toString();
                }
            } catch (Exception e) {
                LOG.warn("Failed to read file content: " + metaInfo.getPath(), e);
            }

            addDocument(
                    word.id(),
                    metaInfo.getPath(),
                    content,
                    word.vector(),
                    metaInfo.getStartLine(),
                    metaInfo.getEndLine()
            );
        }

        // 提交更改
        indexWriter.commit();
    }

    /**
     * 关闭索引
     */
    public void close() {
        try {
            if (indexWriter != null) {
                indexWriter.close();
            }
            if (directory != null) {
                directory.close();
            }
        } catch (IOException e) {
            LOG.error("Error closing Lucene index", e);
        }
    }

    private List<String> getOldIndexStorePath(String pluginBasePath) {
        List<String> result = new ArrayList<>();

        // 历史旧版本
        for (int i = 1; i < curVersion; i++) {
            result.add(getIndexStorePath(pluginBasePath, i));
        }
        return result;
    }

    private String getIndexStorePath(String pluginBasePath, int version) {
        return pluginBasePath + File.separator + "lucene_" + version;
    }

    private static class ScoredDocument {
        final int docId;
        final float score;

        ScoredDocument(int docId, float score) {
            this.docId = docId;
            this.score = score;
        }
    }

    /**
     * 自定义向量相似度查询 - Lucene 8.x 兼容实现
     */
    private static class VectorSimilarityQuery extends Query {
        private final String field;
        private final double[] queryVector;
        private final int k;

        public VectorSimilarityQuery(String field, double[] queryVector, int k) {
            this.field = field;
            this.queryVector = queryVector;
            this.k = k;
        }

        @Override
        public Weight createWeight(IndexSearcher searcher, ScoreMode scoreMode, float boost) throws IOException {
            return new Weight(this) {
                @Override
                public void extractTerms(Set<Term> terms) {
                    // 不向terms集合添加任何内容
                }

                @Override
                public Explanation explain(LeafReaderContext context, int doc) throws IOException {
                    return Explanation.match(scoreDoc(context, doc), "vector similarity score");
                }

                @Override
                public Scorer scorer(LeafReaderContext context) throws IOException {
                    return new Scorer(this) {
                        private int docId = -1;
                        private final int maxDoc = context.reader().maxDoc();

                        @Override
                        public DocIdSetIterator iterator() {
                            return new DocIdSetIterator() {
                                @Override
                                public int docID() {
                                    return docId;
                                }

                                @Override
                                public int nextDoc() throws IOException {
                                    return advance(docId + 1);
                                }

                                @Override
                                public int advance(int target) throws IOException {
                                    docId = target;
                                    while (docId < maxDoc) {
                                        if (scoreDoc(context, docId) > 0) {
                                            return docId;
                                        }
                                        docId++;
                                    }
                                    return NO_MORE_DOCS;
                                }

                                @Override
                                public long cost() {
                                    return maxDoc;
                                }
                            };
                        }

                        @Override
                        public float score() throws IOException {
                            return scoreDoc(context, docId);
                        }

                        @Override
                        public int docID() {
                            return docId;
                        }

                        @Override
                        public float getMaxScore(int upTo) throws IOException {
                            return Float.MAX_VALUE;
                        }
                    };
                }

                @Override
                public boolean isCacheable(LeafReaderContext ctx) {
                    return false;
                }
            };
        }

        private float scoreDoc(LeafReaderContext context, int docId) throws IOException {
            Document doc = context.reader().document(docId);
            IndexableField vectorField = doc.getField(field);
            if (vectorField == null) {
                return 0.0f;
            }
            
            byte[] vectorBytes = vectorField.binaryValue().bytes;
            float[] storedVector = byteArrayToFloatArray(vectorBytes);
            
            // 计算余弦相似度
            return (float) cosineSimilarity(queryVector, storedVector);
        }

        /**
         * 计算余弦相似度
         */
        private double cosineSimilarity(double[] vec1, float[] vec2) {
            if (vec1.length != vec2.length) {
                return 0.0;
            }
            
            double dotProduct = 0.0;
            double norm1 = 0.0;
            double norm2 = 0.0;
            
            for (int i = 0; i < vec1.length; i++) {
                dotProduct += vec1[i] * vec2[i];
                norm1 += vec1[i] * vec1[i];
                norm2 += vec2[i] * vec2[i];
            }
            
            if (norm1 == 0.0 || norm2 == 0.0) {
                return 0.0;
            }
            
            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        }

        @Override
        public String toString(String field) {
            return "VectorSimilarityQuery(" + this.field + ")";
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            VectorSimilarityQuery that = (VectorSimilarityQuery) obj;
            return k == that.k &&
                    Objects.equals(field, that.field) &&
                    Arrays.equals(queryVector, that.queryVector);
        }

        @Override
        public int hashCode() {
            int result = Objects.hash(field, k);
            result = 31 * result + Arrays.hashCode(queryVector);
            return result;
        }
    }
}
