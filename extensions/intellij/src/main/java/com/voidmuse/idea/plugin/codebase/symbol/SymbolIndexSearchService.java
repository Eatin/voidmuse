package com.voidmuse.idea.plugin.codebase.symbol;

import com.intellij.codeInsight.completion.impl.CamelHumpMatcher;
import com.intellij.openapi.application.ReadAction;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.ThrowableComputable;
import com.intellij.psi.*;
import com.intellij.psi.search.GlobalSearchScope;
import com.intellij.psi.search.PsiSearchHelper;
import com.intellij.psi.search.PsiShortNamesCache;
import com.intellij.util.ThrowableRunnable;
import com.voidmuse.idea.plugin.codebase.embedding.FindNearFileInfo;
import com.voidmuse.idea.plugin.codebase.embedding.OptimizeCodebasePromptResult;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.compress.utils.Lists;
import org.apache.commons.lang3.StringUtils;

import java.util.*;
import java.util.stream.Stream;

/**
 * @author zhangdaguan
 */
@Slf4j
@Service(Service.Level.PROJECT)
public final class SymbolIndexSearchService {
    private static final Logger LOG = Logger.getInstance(SymbolIndexSearchService.class);
    private final Project project;

    public SymbolIndexSearchService(Project project) {
        this.project = project;
    }

    public static SymbolIndexSearchService getInstance(Project project) {
        return project.getService(SymbolIndexSearchService.class);
    }

    public List<PsiClass> searchClassByName(String queryName) {
        try {
            //支持idea内置的类名驼峰匹配查找，不区分大小写
            CamelHumpMatcher matcher = new CamelHumpMatcher(queryName, false);

            return ReadAction.compute((ThrowableComputable<List<PsiClass>, Throwable>) () -> {
                String[] allClassNames = PsiShortNamesCache.getInstance(project).getAllClassNames();

                return Arrays.stream(allClassNames)
                        .filter(name -> matcher.prefixMatches(name) || name.toLowerCase().contains(queryName.toLowerCase()))
                        .flatMap(name -> Stream.of(PsiShortNamesCache.getInstance(project)
                                .getClassesByName(name, GlobalSearchScope.projectScope(project))))
                        .toList();
            });
        } catch (Throwable e) {
            LOG.warn("searchClassByName error.", e);
            return Lists.newArrayList();
        }
    }

    /**
     * 使用不区分大小写的驼峰匹配和普通模糊匹配搜索方法名
     *
     * @param queryName 查询关键词
     * @return 匹配的 PsiMethod 列表
     */
    public List<PsiMethod> searchMethodByName(String queryName) {
        try {
            // 创建不区分大小写的 CamelHumpMatcher
            CamelHumpMatcher matcher = new CamelHumpMatcher(queryName, false);

            return ReadAction.compute((ThrowableComputable<List<PsiMethod>, Throwable>) () -> {
                String[] allMethodNames = PsiShortNamesCache.getInstance(project).getAllMethodNames();

                return Arrays.stream(allMethodNames)
                        .filter(name -> matcher.prefixMatches(name)
                                || name.toLowerCase().contains(queryName.toLowerCase()))
                        .flatMap(name -> Stream.of(PsiShortNamesCache.getInstance(project)
                                .getMethodsByName(name, GlobalSearchScope.projectScope(project))))
                        .toList();
            });
        } catch (Throwable e) {
            LOG.warn("searchMethodByName error.", e);
            return Lists.newArrayList();
        }
    }

    /**
     * 使用不区分大小写的驼峰匹配和普通模糊匹配搜索符号（类、方法、变量等）
     *
     * @param queryName 查询关键词
     * @return 匹配的 PsiElement 列表
     */
    public SymbolIndexSearchResult searchSymbolByName(String queryName) {
        try {
            //支持idea内置的类名驼峰匹配查找，不区分大小写
            CamelHumpMatcher matcher = new CamelHumpMatcher(queryName, false);
            PsiShortNamesCache cache = PsiShortNamesCache.getInstance(project);
            SymbolIndexSearchResult searchResult = new SymbolIndexSearchResult();

            // Parallel execution of all search operations
            List<Runnable> searchTasks = new ArrayList<>();

            // Class search task
            searchTasks.add(() -> {
                try {
                    ReadAction.run((ThrowableRunnable<Throwable>) () -> {
                        String[] allClassNames = cache.getAllClassNames();
                        Arrays.stream(allClassNames)
                                .filter(name -> matcher.prefixMatches(name) || name.toLowerCase().contains(queryName.toLowerCase()))
                                .flatMap(name -> Stream.of(cache.getClassesByName(name, GlobalSearchScope.projectScope(project))))
                                .forEach(c -> searchResult.getClazzList().add(c));
                    });
                } catch (Throwable e) {
                    LOG.warn("Class search task error.", e);
                }
            });

            // Method search task
            searchTasks.add(() -> {
                try {
                    ReadAction.run((ThrowableRunnable<Throwable>) () -> {
                        String[] allMethodNames = cache.getAllMethodNames();
                        Arrays.stream(allMethodNames)
                                .filter(name -> matcher.prefixMatches(name) || name.toLowerCase().contains(queryName.toLowerCase()))
                                .flatMap(name -> Stream.of(cache.getMethodsByName(name, GlobalSearchScope.projectScope(project))))
                                .forEach(m -> searchResult.getMethodList().add(m));
                    });
                } catch (Throwable e) {
                    LOG.warn("Method search task error.", e);
                }
            });

            // Field search task
            searchTasks.add(() -> {
                try {
                    ReadAction.run((ThrowableRunnable<Throwable>) () -> {
                        String[] allFieldNames = cache.getAllFieldNames();
                        Arrays.stream(allFieldNames)
                                .filter(name -> matcher.prefixMatches(name) || name.toLowerCase().contains(queryName.toLowerCase()))
                                .flatMap(name -> Stream.of(cache.getFieldsByName(name, GlobalSearchScope.projectScope(project))))
                                .forEach(fd -> searchResult.getFieldList().add(fd));
                    });
                } catch (Throwable e) {
                    LOG.warn("Field search task error.", e);
                }
            });

            // File search task
            searchTasks.add(() -> {
                try {
                    ReadAction.run((ThrowableRunnable<Throwable>) () -> {
                        String[] allFileNames = cache.getAllFileNames();
                        Arrays.stream(allFileNames)
                                .filter(name -> matcher.prefixMatches(name) || name.toLowerCase().contains(queryName.toLowerCase()))
                                .flatMap(name -> Stream.of(cache.getFilesByName(name)))
                                .forEach(f -> searchResult.getFileList().add(f));
                    });
                } catch (Throwable e) {
                    LOG.warn("File search task error.", e);
                }
            });
            // Execute all tasks in parallel
            searchTasks.parallelStream().forEach(Runnable::run);
            return searchResult;
        } catch (Throwable e) {
            LOG.warn("searchSymbolByName error.", e);
            return new SymbolIndexSearchResult();
        }
    }

    /**
     * 文本搜索
     *
     * @param queryName
     * @return
     */
    public List<PsiFile> searchElementFileByTextWords(String queryName) {
        try {
            return ReadAction.compute((ThrowableComputable<List<PsiFile>, Throwable>) () -> {
                PsiSearchHelper searchHelper = PsiSearchHelper.getInstance(project);
                // 搜索关键词在文件中的引用
                PsiFile[] resultFiles = searchHelper.findFilesWithPlainTextWords(queryName);
                return Arrays.stream(resultFiles).toList();
            });
        } catch (Throwable e) {
            LOG.warn("searchElementFileByTextWords error.", e);
            return Lists.newArrayList();
        }
    }

    public SymbolIndexSearchFilePaths doSearchText(OptimizeCodebasePromptResult optimizeResult) {
        if (CollectionUtils.isEmpty(optimizeResult.getPsiNames())) {
            return null;
        }
        long totalStart = System.currentTimeMillis();
        SymbolIndexSearchFilePaths searchFilePaths = new SymbolIndexSearchFilePaths();
        List<SymbolIndexSearchResult> searchResults = optimizeResult.getPsiNames().stream()
                //符号搜索排除中文
                .filter(StringUtils::isAsciiPrintable)
                .parallel()
                .map(this::searchSymbolByName)
                .toList();
        List<String> clazzPaths = searchResults.stream()
                .flatMap(r -> r.getClazzList().stream())
                .map(clazz -> clazz.getContainingFile().getVirtualFile().getPath())
                .map(SymbolIndexSearchService::normalizePath)
                .toList();
        searchFilePaths.getClazzPaths().addAll(clazzPaths);

        List<String> methodPaths = searchResults.stream()
                .flatMap(r -> r.getMethodList().stream())
                .map(method -> method.getContainingFile().getVirtualFile().getPath())
                .map(SymbolIndexSearchService::normalizePath)
                .toList();
        searchFilePaths.getMethodPaths().addAll(methodPaths);

        List<String> fieldPaths = searchResults.stream()
                .flatMap(r -> r.getFieldList().stream())
                .map(field -> field.getContainingFile().getVirtualFile().getPath())
                .map(SymbolIndexSearchService::normalizePath)
                .toList();
        searchFilePaths.getFieldPaths().addAll(fieldPaths);

        List<String> filePaths = searchResults.stream()
                .flatMap(r -> r.getFileList().stream())
                .map(file -> file.getVirtualFile().getPath())
                .map(SymbolIndexSearchService::normalizePath)
                .toList();
        searchFilePaths.getFilePaths().addAll(filePaths);

        //最后搜索一下纯文本文件的匹配
        List<String> elementPaths = optimizeResult.getPsiNames().stream()
                .flatMap(name -> searchElementFileByTextWords(name).stream())
                .map(element -> element.getVirtualFile().getPath())
                .map(SymbolIndexSearchService::normalizePath)
                .toList();
        searchFilePaths.getTextFilePaths().addAll(elementPaths);

        LOG.info("doSearchText cost time:" + (System.currentTimeMillis() - totalStart));
        return searchFilePaths;
    }

    /**
     * 根据文本搜索结果权重重新计算向量搜索的距离得分
     *
     * @param fileInfoList
     * @param searchResult
     */
    public void recalculateDistance(List<FindNearFileInfo> fileInfoList, SymbolIndexSearchFilePaths searchResult) {
        if (searchResult == null) {
            return;
        }
        List<String> clazzPaths = searchResult.getClazzPaths();
        List<String> methodPaths = searchResult.getMethodPaths();
        List<String> fieldPaths = searchResult.getFieldPaths();
        List<String> filePaths = searchResult.getFilePaths();
        List<String> textPaths = searchResult.getTextFilePaths();
        //计算符号搜索得分，符合类名记0.5，符合方法名记0.25，符合变量引用名计0.15，符合文件名，纯文本计0.1，符号搜索总影响向量距离的0.3权重
        for (FindNearFileInfo nearFileInfo : fileInfoList) {
            Double distance = nearFileInfo.getDistance();
            String path = normalizePath(nearFileInfo.getPath());
            double score = 0;
            if (clazzPaths.contains(path)) {
                score = 0.5;
            } else if (methodPaths.contains(path)) {
                score = 0.3;
            } else if (fieldPaths.contains(path)) {
                score = 0.15;
            } else if (filePaths.contains(path) || textPaths.contains(path)) {
                score = 0.5;
            }
            distance = distance - distance * 0.3 * score;
            nearFileInfo.setDistance(distance);
        }
    }

    public static String normalizePath(String path) {
        return path.replace("\\", "/");
    }

}
