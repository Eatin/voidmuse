import * as vscode from 'vscode';
import * as fsp from 'fs/promises';
import * as path from 'path';
import ignore from 'ignore';
import * as fs from 'fs';
import SettingsService from './SettingsService';
import { createLogger } from './logger';

const logger = createLogger('FileService');

/**
 * 文件信息接口
 */
export interface FileInfo {
    name: string;
    path: string;
    content?: string;
    mtime: number;
    atime: number;
}

class FileService {
    private defaultIgnorePatterns: string[] = [
        'out',
        'dist',
        'node_modules',
        '.vscode-test/',
        '*.vsix',
        '.vscode',
        '.idea'
    ];

    // 缓存存储工作空间文件列表，Map<工作空间文件夹路径, Set<FileInfo>>
    private workspaceFilesCache: Map<string, Set<FileInfo>> = new Map();

    // 存储每个工作空间文件夹的 ignore 实例
    private workspaceIgnores: Map<string, ignore.Ignore> = new Map();

    // 初始化完成的 Promise
    private initializationPromise: Promise<void>;

    // 临时存储最近删除的文件路径
    private recentlyDeleted: Map<string, number> = new Map(); // key: oldUri, value: timestamp
    private readonly renameDetectionInterval = 1000; // 时间窗口，单位毫秒

    // 文件系统监听器
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor() {
        // 开始初始化工作空间
        this.initializationPromise = this.initializeWorkspace();
        // 初始化文件系统监听
        this.initializeFileWatcher();
    }

    /**
     * 初始化工作空间，加载初始文件列表并设置忽略规则
     */
    private async initializeWorkspace() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders) {
                logger.info('FileService: 没有找到工作空间文件夹');
                return;
            }

            for (const folder of workspaceFolders) {
                const ig = ignore();
                const gitignorePath = path.join(folder.uri.fsPath, '.gitignore');
                let hasGitignore = false;

                try {
                    const gitignoreContent = await fsp.readFile(gitignorePath, 'utf8');
                    ig.add(gitignoreContent);
                    hasGitignore = true;
                    logger.info(`FileService: 加载 .gitignore 文件于 ${folder.uri.fsPath}`);
                } catch (error) {
                    // 如果没有 .gitignore 文件，则应用默认忽略规则
                    ig.add(this.defaultIgnorePatterns);
                    logger.info(`FileService: 没有找到 .gitignore 文件，应用默认忽略规则于 ${folder.uri.fsPath}`);
                }

                this.workspaceIgnores.set(folder.uri.fsPath, ig);

                const files = await this.getFilesRecursively(folder.uri.fsPath, ig, folder.uri.fsPath);
                
                const fileInfos: Set<FileInfo> = new Set(files.map(filePath => 
                    {
                        try {
                            const stats = fs.statSync(filePath);
                            return {
                                name: path.basename(filePath),
                                path: filePath,
                                mtime: stats.mtime.getTime(), // 最后修改时间的时间戳
                                atime: stats.atime.getTime()  // 最后访问时间的时间戳
                            };
                        } catch (error) {
                            logger.error(`FileService: 获取文件状态时出错 ${filePath}: ${error}`);
                            return {
                                name: path.basename(filePath),
                                path: filePath,
                                mtime: 0,
                                atime: 0
                            };
                        }
                    }
                ));
                this.workspaceFilesCache.set(folder.uri.fsPath, fileInfos);

                logger.info(`FileService: 初始化文件夹 ${folder.uri.fsPath} 完成，找到 ${files.length} 个文件`);
            }

            logger.info('FileService: 初始化完成');
        } catch (error) {
            logger.error(`FileService: 初始化工作空间时出错: ${error}`);
        }
    }

    /**
     * 初始化文件系统监听，处理增、删、移动、重命名等情况
     */
    private initializeFileWatcher() {
        try {
            this.watcher = vscode.workspace.createFileSystemWatcher('**/*', false, false, false);

            this.watcher.onDidCreate(uri => this.handleFileCreate(uri));
            this.watcher.onDidDelete(uri => this.handleFileDelete(uri));
            // 删除对 onDidRename 的监听，因为该事件不存在

            // 监听工作空间变化，重新初始化
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                logger.info('FileService: 工作空间文件夹变化，重新初始化');
                this.workspaceFilesCache.clear();
                this.workspaceIgnores.clear();
                this.recentlyDeleted.clear();
                this.initializationPromise = this.initializeWorkspace();
            });

            logger.info('FileService: 文件系统监听器已初始化');
        } catch (error) {
            logger.error(`FileService: 初始化文件系统监听器时出错: ${error}`);
        }
    }

    /**
     * 处理文件创建事件
     * @param {vscode.Uri} uri 文件URI
     */
    private async handleFileCreate(uri: vscode.Uri) {
        try {
            // 确保初始化完成
            await this.initializationPromise;

            const folderPath = this.getWorkspaceFolder(uri.fsPath);
            if (!folderPath) {
                logger.info(`FileService: 无法找到文件所属的工作空间文件夹 ${uri.fsPath}`);
                return;
            }

            const ig = this.workspaceIgnores.get(folderPath);
            if (!ig) {
                logger.info(`FileService: 无法找到工作空间文件夹的 ignore 实例 ${folderPath}`);
                return;
            }

            const relativePath = path.relative(folderPath, uri.fsPath).replace(/\\/g, '/');

            // 忽略隐藏文件和隐藏文件夹
            const parts = relativePath.split('/');
            if (parts.some(part => part.startsWith('.'))) {
                logger.info(`FileService: 忽略隐藏文件或文件夹 ${uri.fsPath}`);
                return;
            }

            if (ig.ignores(relativePath)) {
                logger.info(`FileService: 忽略符合忽略规则的文件 ${uri.fsPath}`);
                return;
            }

            // 检查是否为重命名操作
            const possibleOldPath = this.findPossibleRenamedPath(uri.fsPath);
            if (possibleOldPath) {
                logger.info(`FileService: 识别到文件重命名从 ${possibleOldPath} 到 ${uri.fsPath}`);
                this.recentlyDeleted.delete(possibleOldPath);
                // 更新缓存
                const filesSet = this.workspaceFilesCache.get(folderPath);
                if (filesSet) {
                    const stats = fs.statSync(uri.fsPath);
                    filesSet.add(                                        
                     {
                        name: path.basename(uri.fsPath),
                        path: uri.fsPath,
                        mtime: stats.mtime.getTime(), 
                        atime: stats.atime.getTime()  
                    });
                    logger.info(`FileService: 更新缓存，添加文件 ${uri.fsPath}`);
                }
                return;
            }

            if (await this.isFile(uri.fsPath)) {
                const filesSet = this.workspaceFilesCache.get(folderPath);
                const stats = fs.statSync(uri.fsPath);
                if (filesSet) {
                    filesSet.add({
                        name: path.basename(uri.fsPath),
                        path: uri.fsPath,
                        mtime: stats.mtime.getTime(), 
                        atime: stats.atime.getTime()  
                    });
                    logger.info(`FileService: 添加文件到缓存 ${uri.fsPath}`);
                }
            } else if (await this.isDirectory(uri.fsPath)) {
                // 如果是目录，递归添加其中的文件
                const files = await this.getFilesRecursively(uri.fsPath, ig, folderPath);
                const filesSet = this.workspaceFilesCache.get(folderPath);
                if (filesSet) {
                    files.forEach(file => {
                        const stats = fs.statSync(uri.fsPath);
                        filesSet.add({
                        name: path.basename(uri.fsPath),
                        path: uri.fsPath,
                        mtime: stats.mtime.getTime(), 
                        atime: stats.atime.getTime()  
                    });
                        logger.info(`FileService: 添加目录中的文件到缓存 ${file}`);
                    });
                }
            }
        } catch (error) {
            logger.error(`FileService: 处理文件创建事件时出错: ${error}`);
        }
    }

    /**
     * 处理文件删除事件
     * @param {vscode.Uri} uri 文件URI
     */
    private async handleFileDelete(uri: vscode.Uri) {
        try {
            // 确保初始化完成
            await this.initializationPromise;

            const folderPath = this.getWorkspaceFolder(uri.fsPath);
            if (!folderPath) {
                logger.info(`FileService: 无法找到文件所属的工作空间文件夹 ${uri.fsPath}`);
                return;
            }

            const filesSet = this.workspaceFilesCache.get(folderPath);
            if (!filesSet) {
                logger.info(`FileService: 无法找到工作空间文件夹的缓存 ${folderPath}`);
                return;
            }

            const fileInfoToDelete = Array.from(filesSet).find(fileInfo => fileInfo.path === uri.fsPath);
            if (fileInfoToDelete) {
                filesSet.delete(fileInfoToDelete);
                logger.info(`FileService: 从缓存中移除文件 ${uri.fsPath}`);
                // 记录删除事件
                this.recentlyDeleted.set(uri.fsPath, Date.now());
                // 清理过期的记录
                this.cleanUpRecentlyDeleted();
            } else {
                logger.info(`FileService: 文件不存在于缓存中，无需移除 ${uri.fsPath}`);
            }
        } catch (error) {
            logger.error(`FileService: 处理文件删除事件时出错: ${error}`);
        }
    }

    /**
     * 在创建事件中查找可能的重命名路径
     * @param {string} newPath 新文件路径
     * @returns {string | undefined} 可能的旧文件路径
     */
    private findPossibleRenamedPath(newPath: string): string | undefined {
        const now = Date.now();
        for (const [oldPath, timestamp] of this.recentlyDeleted.entries()) {
            if (now - timestamp <= this.renameDetectionInterval) {
                // 可以添加更多的匹配逻辑，例如文件大小、类型等
                return oldPath;
            }
        }
        return undefined;
    }

    /**
     * 清理过期的删除记录
     */
    private cleanUpRecentlyDeleted() {
        const now = Date.now();
        for (const [path, timestamp] of this.recentlyDeleted.entries()) {
            if (now - timestamp > this.renameDetectionInterval) {
                this.recentlyDeleted.delete(path);
            }
        }
    }

    /**
     * 获取文件所属的工作空间文件夹路径
     * @param {string} filePath 文件路径
     * @returns {string | undefined} 工作空间文件夹路径
     */
    private getWorkspaceFolder(filePath: string): string | undefined {
        if (!vscode.workspace.workspaceFolders) {
            return undefined;
        }

        let resolvedFolderPath = '';
        for (const folder of vscode.workspace.workspaceFolders) {
            const folderPath = path.resolve(folder.uri.fsPath);
            if (filePath.startsWith(folderPath)) {
                if (folderPath.length > resolvedFolderPath.length) {
                    resolvedFolderPath = folderPath;
                }
            }
        }
        return resolvedFolderPath || undefined;
    }

    /**
     * 判断路径是否为文件
     * @param {string} filePath 路径
     * @returns {Promise<boolean>} 是否为文件
     */
    private async isFile(filePath: string): Promise<boolean> {
        try {
            const stats = await fsp.stat(filePath);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    /**
     * 判断路径是否为目录
     * @param {string} dirPath 路径
     * @returns {Promise<boolean>} 是否为目录
     */
    private async isDirectory(dirPath: string): Promise<boolean> {
        try {
            const stats = await fsp.stat(dirPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * 获取VSCode工作空间中的所有文件，忽略 .gitignore 中指定的文件路径或默认忽略路径
     * 并忽略隐藏文件，同时使用缓存以提高性能。如果传入keyword，则返回包含文件名包含keyword的文件列表
     * @param {string} [keyword] 关键词，用于过滤文件名
     * @returns {Promise<FileInfo[]>} 文件信息数组
     */
    getAllWorkspaceFiles(keyword?: string): FileInfo[] {
        // 确保初始化完成
        this.initializationPromise;

        let allFiles: FileInfo[] = [];

        for (const filesSet of this.workspaceFilesCache.values()) {
            allFiles = allFiles.concat(Array.from(filesSet));
        }

        

        // 按时间排序：最近修改或访问的排前面
        allFiles.sort((a, b) => {
            // 使用较大的时间值（最近的时间）进行排序
            const maxTimeA = Math.max(a.mtime, a.atime);
            const maxTimeB = Math.max(b.mtime, b.atime);
            return maxTimeB - maxTimeA; // 降序排序
        });


        if (keyword) {
            // 过滤包含keyword的文件
            const lowerKeyword = keyword.toLowerCase();
            return allFiles.filter(fileInfo => {
                const fileName = fileInfo.name.toLowerCase();
                return fileName.includes(lowerKeyword);
            });
        }

        return allFiles;
    }

    getAllWorkspaceFilesOld(keyword?: string): FileInfo[] {
        // 确保初始化完成
        this.initializationPromise;

        let allFiles: FileInfo[] = [];

        for (const filesSet of this.workspaceFilesCache.values()) {
            allFiles = allFiles.concat(Array.from(filesSet));
        }

        if (keyword) {
            // 过滤包含keyword的文件
            const lowerKeyword = keyword.toLowerCase();
            allFiles = allFiles.filter(fileInfo => {
                const fileName = fileInfo.name.toLowerCase();
                return fileName.includes(lowerKeyword);
            });
        }

        return allFiles;
    }

    /**
     * 获取指定路径的文件内容（同步）
     * @param {string} filePath 文件路径
     * @returns {string} 文件内容
     */
    getFileContent(filePath: string): string {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content;
        } catch (error) {
            logger.error(`FileService: 获取文件内容时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 跳转到指定路径的文件
     * @param {string} filePath 文件路径
     * @param {string} [functionName] 函数名（可选）
     */
    jumpToFileByPath(filePath: string, functionName?: string) {
        vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(doc => {
            vscode.window.showTextDocument(doc).then(() => {
                if (functionName) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const position = this.getFunctionPosition(doc.getText(), functionName);
                        if (position) {
                            editor.selection = new vscode.Selection(position, position);
                            editor.revealRange(new vscode.Range(position, position));
                        }
                    }
                }
            });
        });
    }

    private getFunctionPosition(text: string, functionName: string): vscode.Position | undefined {
        const regex = new RegExp(`\\b${functionName}\\b`);
        const match = regex.exec(text);
        if (match) {
            const line = text.substr(0, match.index).split('\n').length - 1;
            const character = match.index - text.lastIndexOf('\n', match.index) - 1;
            return new vscode.Position(line, character);
        }
        return undefined;
    }

    /**
     * 递归获取指定目录下的所有文件，应用忽略规则，并忽略隐藏文件
     * @param {string} dir 目录路径
     * @param {ignore.Ignore} ig ignore 实例
     * @param {string} rootDir 工作空间根目录路径
     * @returns {Promise<string[]>} 文件路径数组
     */
    private async getFilesRecursively(dir: string, ig: ignore.Ignore, rootDir: string): Promise<string[]> {
        let results: string[] = [];

        try {
            const list = await fsp.readdir(dir, { withFileTypes: true });
            for (const dirent of list) {
                const name = dirent.name;
                const fullPath = path.join(dir, name);

                // 忽略隐藏文件和隐藏文件夹（以.开头的）
                if (name.startsWith('.')) {
                    continue;
                }

                const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/'); // 统一使用正斜杠

                if (ig.ignores(relativePath)) {
                    continue;
                }

                if (dirent.isDirectory()) {
                    const subFiles = await this.getFilesRecursively(fullPath, ig, rootDir);
                    results = results.concat(subFiles);
                } else if (dirent.isFile()) {
                    results.push(fullPath);
                }
            }
        } catch (error) {
            logger.error(`FileService: 递归获取文件时出错于目录 ${dir}: ${error}`);
        }

        return results;
    }

    /**
     * 获取第一个工作空间的文件列表
     * @returns {Promise<FileInfo[]>} 文件信息数组
     */
    async getFirstWorkspaceFiles(): Promise<FileInfo[]> {
        await this.initializationPromise; // 等待 initializationPromise 完成
        // logger.info('initializationPromise done');
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            logger.info('FileService: 没有找到工作空间文件夹');
            return [];
        }

        const workspace = workspaceFolders[0];
        const workspacePath = workspace.uri.fsPath;

        // 从缓存中获取工作空间的文件列表
        const files = this.workspaceFilesCache.get(workspacePath);
        return files ? Array.from(files) : [];
    }

     getSelectedFiles(): FileInfo[] {
        const editors = vscode.window.visibleTextEditors;
        const fileInfos: FileInfo[] = editors.map(editor => {
            const document = editor.document;
            const filePath = document.uri.fsPath;
            const stats = fs.statSync(filePath);
            return {
                name:  path.basename(filePath),
                path: filePath,
                 mtime: stats.mtime.getTime(), 
                atime: stats.atime.getTime()  
            };
        });
        return fileInfos;
     }

     getSelectedFilesBySetting() : FileInfo[] {
        const flag = SettingsService.getReferenceFile();
        if(flag){
            return this.getSelectedFiles();
        }else{
            return [];
        }
     }

     async codeToCreateFile(content: string) {
        const newDocument = await vscode.workspace.openTextDocument({
            content: content,
        });
        await vscode.window.showTextDocument(newDocument);
    }

    codeToInsert(content: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, content);
            });
        }
    }

    /**
     * 释放资源
     */
    dispose() {
        if (this.watcher) {
            this.watcher.dispose();
            logger.info('FileService: 文件系统监听器已关闭');
        }
    }

}

export default new FileService();