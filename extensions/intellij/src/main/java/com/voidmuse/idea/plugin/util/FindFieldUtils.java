package com.voidmuse.idea.plugin.util;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.fileEditor.OpenFileDescriptor;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.psi.*;

import java.io.IOException;
import java.nio.charset.Charset;

/**
 * @author zhangdaguan
 */
public final class FindFieldUtils {
    private static final Logger LOG = Logger.getInstance(FindFieldUtils.class);

    private FindFieldUtils() {
        // Utility class
    }

    public static PsiElement findFieldInCodeFile(PsiFile psiFile, String field) {
        if (psiFile == null || field == null) {
            return null;
        }

        try {
            if (psiFile instanceof PsiJavaFile) {
                return findFieldInJavaFile((PsiJavaFile) psiFile, field);
            }
        } catch (Exception e) {
            LOG.warn("Failed to find field in code file", e);
        }
        return null;
    }

    private static PsiElement findFieldInJavaFile(PsiJavaFile javaFile, String field) {
        for (PsiClass psiClass : javaFile.getClasses()) {
            for (PsiField psiField : psiClass.getFields()) {
                if (field.equals(psiField.getName())) {
                    return psiField;
                }
            }
        }
        return null;
    }

    public static int findTextInFile(VirtualFile virtualFile, String text) {
        if (virtualFile == null || text == null) {
            return -1;
        }

        try {
            Charset charset = virtualFile.getCharset();
            String content = new String(virtualFile.contentsToByteArray(), charset);
            String[] lines = content.split("\n");

            for (int i = 0; i < lines.length; i++) {
                if (lines[i].contains(text)) {
                    return i + 1;
                }
            }
        } catch (IOException e) {
            LOG.warn("Failed to find text in file", e);
        }
        return -1;
    }

    public static void navigateToLine(Project project, VirtualFile virtualFile, int lineNumber) {
        if (project == null || virtualFile == null || lineNumber < 1) {
            return;
        }

        FileEditorManager fileEditorManager = FileEditorManager.getInstance(project);
        OpenFileDescriptor descriptor = new OpenFileDescriptor(project, virtualFile, lineNumber - 1, 0);
        fileEditorManager.openTextEditor(descriptor, true);
    }
}
