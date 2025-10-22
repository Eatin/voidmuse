package com.voidmuse.idea.plugin.protocol;

/**
 * @author zhangdaguan
 */
public enum CallJavaProtocol {
    jumpToFile,
    canLocateClassMethod,
    jumpToFileByPath,
    findFile,
    persistentState,
    getPersistentState,
    getFileContent,
    openUrl,
    handleJsCallback,
    buildWithCodebaseContext,
    isCodebaseIndexExists,
    getSelectedFiles,
    codeToInsert,
    getProjectConfig,
    closeWindow,
    getCodebaseIndexingProgress,
    testMcpConnection,
    callMcpTool,
    getMcpTools,
    writeFile,
    getUrlContent,
    executeCommand,
    executeScript,
    getScriptStatus,
    stopScript
}
