package com.voidmuse.idea.plugin.util;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.util.io.FileUtil;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FileUtils {

    private static final Logger LOG = Logger.getInstance(FileUtils.class);

    public static File createFile(String directoryPath, String fileName, String fileContent) {
        try {
            tryCreateDirectory(directoryPath);
            return Files.writeString(
                    Path.of(directoryPath, fileName),
                    fileContent,
                    StandardOpenOption.CREATE).toFile();
        } catch (IOException e) {
            throw new RuntimeException("Failed to create file", e);
        }
    }

    public static void tryCreateDirectory(String directoryPath) {
        try {
            if (!FileUtil.exists(directoryPath)) {
                if (!FileUtil.createDirectory(Path.of(directoryPath).toFile())) {
                    throw new IOException("Failed to create directory: " + directoryPath);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to create directory", e);
        }
    }


    public static String getFileExtension(String filename) {
        Pattern pattern = Pattern.compile("[^.]+$");
        Matcher matcher = pattern.matcher(filename);

        if (matcher.find()) {
            return matcher.group();
        }
        return "";
    }


    public static final List<String> ignoredFileDirectories = List.of(
            "node_modules",
            ".git",
            ".gitignore",
            ".svn",
            ".bzr",
            ".cvs",
            ".m2",
            ".idea",
            ".vscode",
            ".project",
            ".settings",
            "node_modules",
            "vendor",
            "lib",
            "build",
            "target",
            "media",
            "logs",
            "uploads",
            ".DS_Store");
}
