package com.voidmuse.idea.plugin.service;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import com.google.common.collect.Lists;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectUtil;
import com.intellij.openapi.vcs.changes.ChangeListManager;
import com.intellij.openapi.vcs.changes.VcsIgnoreManager;
import com.intellij.openapi.vfs.VirtualFile;
import com.voidmuse.idea.plugin.file.FileInfo;
import com.voidmuse.idea.plugin.util.FileUtils;
import org.jetbrains.annotations.NotNull;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service(Service.Level.PROJECT)
public final class FileService {
    private final Project project;
    private List<FileInfo> cachedFileInfoList = Lists.newArrayList();
    private final VcsIgnoreManager ignoreManager;
    private final ChangeListManager changeListManager;
    private static final Logger LOG = Logger.getInstance(FileService.class);
    private static final int FIND_FILE_MAX_SIZE = 500;

    public FileService(Project project) {
        this.project = project;
        ignoreManager = VcsIgnoreManager.getInstance(project);
        changeListManager = ChangeListManager.getInstance(project);
    }

    public static FileService getInstance(Project project) {
        return project.getService(FileService.class);
    }

    public void startCacheUpdater() {
        ProjectScheduledService.getInstance(project).scheduleAtFixedRate(this::updateFileCache, 2, 10, TimeUnit.SECONDS);
    }

    public List<FileInfo> findFile(String keyword) {
        //优先返回当前打开的文件
        List<VirtualFile> openFiles = Arrays.asList(FileEditorManager.getInstance(project).getOpenFiles());
        List<FileInfo> retList = cachedFileInfoList.stream()
                .filter(fileInfo -> StrUtil.isBlank(keyword) || fileInfo.getName().toLowerCase().contains(keyword.toLowerCase()))
                .sorted((f1, f2) -> {
                    boolean f1Open = openFiles.stream().anyMatch(vf -> vf.getPath().equals(f1.getPath()));
                    boolean f2Open = openFiles.stream().anyMatch(vf -> vf.getPath().equals(f2.getPath()));
                    if (f1Open && !f2Open) {
                        return -1;
                    } else if (!f1Open && f2Open) {
                        return 1;
                    }
                    boolean f1IsCode = isCodeFile(f1.getPath());
                    boolean f2IsCode = isCodeFile(f2.getPath());

                    if (f1IsCode && !f2IsCode) {
                        return -1;
                    } else if (!f1IsCode && f2IsCode) {
                        return 1;
                    }
                    return 0;
                })
                .collect(Collectors.toList());
        if (retList.size() > FIND_FILE_MAX_SIZE) {
            retList = retList.subList(0, FIND_FILE_MAX_SIZE);
        }
        return retList;
    }

    public List<FileInfo> findFileByCurEditor(String keyword, Editor curEditor) {
        List<VirtualFile> openFiles = Arrays.asList(FileEditorManager.getInstance(project).getOpenFiles());
        VirtualFile currentFile = curEditor.getVirtualFile();
        String currentDir = currentFile != null && currentFile.getParent() != null ? currentFile.getParent().getPath() : "";
        currentDir = currentDir.replace("\\", "/");

        String finalCurrentDir = currentDir;
        List<FileInfo> retList = cachedFileInfoList.stream()
                .filter(fileInfo -> StrUtil.isBlank(keyword) || fileInfo.getName().toLowerCase().contains(keyword.toLowerCase()))
                .sorted((f1, f2) -> {
                    boolean f1Open = openFiles.stream().anyMatch(vf -> vf.getPath().equals(f1.getPath()));
                    boolean f2Open = openFiles.stream().anyMatch(vf -> vf.getPath().equals(f2.getPath()));

                    if (f1Open && !f2Open) {
                        return -1;
                    } else if (!f1Open && f2Open) {
                        return 1;
                    }
                    boolean f1SameDir = finalCurrentDir.equals(Paths.get(f1.getPath()).getParent().toString().replace("\\", "/"));
                    boolean f2SameDir = finalCurrentDir.equals(Paths.get(f2.getPath()).getParent().toString().replace("\\", "/"));

                    if (f1SameDir && !f2SameDir) {
                        return -1;
                    } else if (!f1SameDir && f2SameDir) {
                        return 1;
                    }

                    boolean f1IsCode = isCodeFile(f1.getPath());
                    boolean f2IsCode = isCodeFile(f2.getPath());

                    if (f1IsCode && !f2IsCode) {
                        return -1;
                    } else if (!f1IsCode && f2IsCode) {
                        return 1;
                    }

                    return 0;
                })
                .collect(Collectors.toList());
        if (retList.size() > FIND_FILE_MAX_SIZE) {
            retList = retList.subList(0, FIND_FILE_MAX_SIZE);
        }
        return retList;
    }

    private boolean isCodeFile(String path) {
        String lowerPath = path.toLowerCase();
        return lowerPath.endsWith(".java") || lowerPath.endsWith(".py") || lowerPath.endsWith(".js") ||
                lowerPath.endsWith(".cpp") || lowerPath.endsWith(".cs") || lowerPath.endsWith(".rb") ||
                lowerPath.endsWith(".go") || lowerPath.endsWith(".php") || lowerPath.endsWith(".kt");
    }

    private void updateFileCache() {
        long startTime = System.currentTimeMillis();
        LOG.info("Updating file cache start...");
        Map<String, String> fileMap = new HashMap<>();
        if (project == null) {
            throw new IllegalArgumentException("Project cannot be null.");
        }
        var projectDirectory = ProjectUtil.guessProjectDir(project);
        List<VirtualFile> fileList = Lists.newArrayList();
        if (projectDirectory != null) {
            traverseDirectory(fileList, projectDirectory);
        }


        String basePath = project.getBasePath();
        Path baseDirPath = Paths.get(basePath).toAbsolutePath().normalize();
        List<VirtualFile> files = fileList.stream()
                .filter(file -> !isIgnoreFile(file))
                .filter(file -> {
                    String filePath = baseDirPath.relativize(Paths.get(file.getPath())).toString();
                    return !filePath.startsWith(".");
                })
                .toList();

        for (VirtualFile file : files) {
            fileMap.put(file.getPath().replace("\\", "/"), file.getName());
        }

        cachedFileInfoList = fileMap.entrySet().stream()
                .map(entry -> new FileInfo(entry.getValue(), entry.getKey()))
                .collect(Collectors.toList());
        LOG.info("File cache updated fileSize: " + cachedFileInfoList.size());
        LOG.info("File cache updated successfully. Time taken: " + (System.currentTimeMillis() - startTime) + " ms");
    }

    public boolean isGitIgnore(VirtualFile file) {
        if (ignoreManager != null && ignoreManager.isPotentiallyIgnoredFile(file)) {
            return true;
        }
        return changeListManager != null && changeListManager.isIgnoredFile(file);
    }


    public void traverseDirectory(@NotNull List<VirtualFile> fileList, @NotNull VirtualFile projectDirectory) {
        for (VirtualFile childFile : projectDirectory.getChildren()) {
            if (isIgnoreFile(childFile)) {
                continue;
            }

            if (childFile.isDirectory()) {
                traverseDirectory(fileList, childFile);
            } else {
                fileList.add(childFile);
            }
        }
    }

    public boolean isIgnoreFile(VirtualFile file) {
        if (FileUtils.ignoredFileDirectories.parallelStream().anyMatch(it -> it.equalsIgnoreCase(file.getName()))) {
            return true;
        }
        return isGitIgnore(file);
    }

    public boolean isCodeBaseIgnoreFile(VirtualFile file) {
        if (isIgnoreFile(file)) {
            return true;
        }
        //pb自动生成的文件也排除，不进行codebase索引
        return isPbAutoGenerated(file);
    }

    /**
     * 判断输入的VirtualFile是否是pb自动生成的代码文件
     *
     * @param file 要判断的VirtualFile
     * @return 如果是pb自动生成的代码文件则返回true，否则返回false
     */
    public boolean isPbAutoGenerated(VirtualFile file) {
        if (file == null || !file.isValid() || file.isDirectory() || !file.exists() || !FileUtil.exist(file.getPath())) {
            return false;
        }

        // 检查文件内容是否包含protobuf生成的标识
        try {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(file.getPath()), StandardCharsets.UTF_8))) {
                String firstLine = reader.readLine();
                if (firstLine != null && firstLine.contains("Generated by the protocol buffer compiler")) {
                    return true;
                }
            } catch (Exception e) {
                LOG.error("Error reading file content for pb auto-generation check", e);
            }

            return false;
        } catch (Exception e) {
            LOG.error("Error reading file content for pb auto-generation check", e);
        }

        return false;
    }

    /**
     * 返回当前编辑器打开的聚焦的文件信息
     */
    public List<FileInfo> getSelectedFiles() {
        VirtualFile[] selectedFiles = FileEditorManager.getInstance(project).getSelectedFiles();
        if (selectedFiles.length == 0) return Lists.newArrayList();
        return Arrays.stream(selectedFiles).map(
                vFile -> {
                    String fileName = vFile.getName();
                    String filePath = vFile.getPath();
                    return new FileInfo(fileName, filePath);
                }
        ).toList();
    }

    public String getFileContent(String path) {
        return FileUtil.readUtf8String(path);
    }


    public String getFileContentRange(String path, int startLine, int endLine) {
        if (StrUtil.isBlank(path) || startLine < 1 || endLine < startLine) {
            return "";
        }
        try {
            List<String> lines = FileUtil.readUtf8Lines(path);
            if (endLine > lines.size()) {
                return "";
            }
            return lines.subList(startLine - 1, endLine).stream()
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            LOG.error("Error reading file content range", e);
            return "";
        }
    }
}
