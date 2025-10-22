import axios from 'axios';
const arrow = require("apache-arrow")
const path = require('path');
const os = require('os');
import * as vscode from 'vscode';
import FileService, { FileInfo } from './FileService';
import { v4 as uuidv4 } from "uuid";
import { Base64 } from 'js-base64';
const fs = require('fs');
const winston = require('winston');
import { createLogger } from './logger';
import { isTextFile, isTextString } from './EmbeddingsUtils';
import { processChineseLines } from './TokenizerService';
import {VoidmuseWebViewProvider} from '../extension';
import { Sha256Service } from './Sha256Service';
import EmbeddingsSettings from './EmbeddingsSettings';
import { EmbeddingsVectorService, EmbeddingsContent, EmbeddingsQueryResult } from './EmbeddingsVectorService';
import { EmbeddingsFile, EmbeddingsFileService } from './EmbeddingsFileService';
import { version } from 'os';
import { time } from 'console';
const logger = createLogger('EmbeddingsService');
const sha256Service = new Sha256Service();


export class EmbeddingsService {

    private initIndexRunning: boolean = false;
    private initIndexDone: boolean = false;

    private isTaskRunning: boolean = false;
    private processFilesCount = 0;
    private embeddingFilesCount = 0;
    private readyRate = 0.5;
    private workspacePath!: string;
    private workspaceFilesCount = 0;

    private pLimitSize = 8;
    // 强制重新计算embeddings，不要设置成true
    private forceEmbeddingsWhenExists = false;

    private embeddingCostTime = 0;
    private indexCostTime = 0;
    private model: string;
    // private ldbService!: LanceDbService;
    private embeddingsFileService!: EmbeddingsFileService;
    private embeddingsVectorService!: EmbeddingsVectorService;

    private webviewViewProvider: VoidmuseWebViewProvider;
    pendingEmbeddings = new Map<string, (items:number[][]) => void>();

    constructor(webviewViewProvider:VoidmuseWebViewProvider) {
        this.webviewViewProvider = webviewViewProvider;
        const flag = this.isCodeBaseEnable();
        this.model = this.getEmbeddingsModel();
        logger.info('v3 vvv logger, flag: %s, model: %s', flag, this.model);

        if (flag && false) {
            this.initIndex();
            setInterval(() => {
                if (this.initIndexDone && !this.isTaskRunning) {
                    // 暂时去掉增量文件处理
                    // this.executeScheduledTask();
                }
            }, 60 * 1000);
        }
    }

    // function：是否允许开启codebase
    private isCodeBaseEnable(): boolean {
        return EmbeddingsSettings.getCodeBaseEnable();
    }

    // function: codebase是否已ready
    private isCodeBaseReady(): boolean {
        var result: number = this.embeddingFilesCount * 1.0 / this.workspaceFilesCount;
        logger.info(`vvv isCodeBaseReady, embeddingFilesCount: ${this.embeddingFilesCount}, workspaceFilesCount: ${this.workspaceFilesCount}, result: ${result}`);
        return result >= this.readyRate;
    }

    // function: embeddings的模型名称
    private getEmbeddingsModel(): string {
        return EmbeddingsSettings.getEnabledEmbeddingModelId();
    }

    private concurrentCount = 0;

    async initIndex() {
        if (this.initIndexRunning) {
            logger.info(`v3 vvv ignore initIndex cause initIndexRunning=true`);
            return;
        }
        this.initIndexRunning = true;

        try {
            await this.initIndex0();
        } catch (error) {
            logger.error(`v3 vvv initIndex error: ${error}`);
        }
        this.initIndexRunning = false;
    }

    async initIndex0() {
        if (!this.isCodeBaseEnable()) {
            logger.info(`v3 vvv ignore initIndex cause isCodeBaseEnable=false`);
            return;
        }

        logger.info(`v3 vvv initIndex start, jsFile ready`);

        const userHome = os.homedir();
        const platform = os.platform();

        // 当前时间戳
        const timestamp = new Date().getTime();
        logger.info(`timestamp: ${timestamp}`);

        logger.info(`userHome: ${userHome}, platform: ${platform}`);

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.workspacePath = workspaceFolders[0].uri.fsPath;
            logger.info(`vvv workspacePath: ${this.workspacePath}`);

            const embeddingsPath = this.getEmbeddingsPath();
            if (!fs.existsSync(embeddingsPath)) {
                fs.mkdirSync(embeddingsPath, { recursive: true });
            }
            logger.info(`init embeddingsPath: ${embeddingsPath}`);

            this.embeddingsVectorService = new EmbeddingsVectorService(embeddingsPath, this.workspacePath);
            logger.info(`init embeddingsVectorService`);

            this.embeddingsFileService = new EmbeddingsFileService(embeddingsPath, this.workspacePath, this.embeddingsVectorService);
            logger.info(`init embeddingsFileService`);

            // this.ldbService = new LanceDbService(folderPath);
            // logger.info(`LanceDbService init`);
            
            const files = await FileService.getFirstWorkspaceFiles();
            logger.info(`pLimitSize: ${this.pLimitSize}, files.length: ${files.length}`);
            this.workspaceFilesCount = files.length;

            const time0 = Date.now();

            // LanceDB 没有 beginUpdate/endUpdate 方法，使用批处理替代
            for (const file of files) {
                if (!this.isCodeBaseEnable()) {
                    logger.info(`initIndex break, codebase not enable`);
                    break;
                }
                await this.saveIndexAsync(file);
                await this.buildWorkspaceEmbeddings(file.path);
                this.embeddingFilesCount++;
                this.isCodeBaseReady();
                logger.info(`v3 vvv ${this.embeddingFilesCount} initIndex total costTime: ${Date.now() - time0} ms`);
            }
            // this.ldbService.addContentIndex();
            this.embeddingFilesCount = this.processFilesCount;
            this.processFilesCount = 0;
            logger.info("initIndex done");
            // 总共耗时
            const endTime = new Date().getTime();
            logger.info(`initIndex done v3, pLimitSize: ${this.pLimitSize} cost: ${endTime - timestamp} ms`);
            this.initIndexDone = true;

            this.embeddingsFileService.logWorkspace();
        }
    }

    // function: getEmbeddingsPath
    // 默认：path.resolve('d:\\voidmuse\\embeddings')，如果不存在，则使用：path.join(userHome, 'voidmuse', 'embeddings')
    private getEmbeddingsPath(): string {
        const defaultPath = path.resolve('d:\\voidmuse\\embeddings');
        if (fs.existsSync(defaultPath)){
            return defaultPath;
        }
        return path.join(os.homedir(), 'voidmuse', 'embeddings');
    }

    /**
     * 构建workspace表：
     * 1. 查询filepath的EmbeddingsFile
     * 2. 取chunksha256s，切分后，复制数据到workspace表
     * todo: filepath修改为数组，支持批量处理
     */
    async buildWorkspaceEmbeddings(filepath: string) {
        const embeddingsFile = await this.embeddingsFileService.findEmbeddingsFile(filepath);
        if (embeddingsFile){
            const chunksha256s = embeddingsFile.chunksha256s;
            if(chunksha256s){
                const chunksha256sArray = chunksha256s.split(',');
                await this.embeddingsVectorService.copyDataToWorkspaceTable(this.model, chunksha256sArray);
            }
        }
        logger.info(`vvv buildWorkspaceEmbeddings done, filepath: ${filepath}`);
    }

    getCodebaseIndexingProgress(): string{
        var result: number = this.embeddingFilesCount * 1.0 / this.workspaceFilesCount;
        if(result > this.readyRate){
            result = 1;
        }
        const progress = result.toFixed(2);
        logger.info(`vvv getCodebaseIndexingProgress, progress: ${progress}`);
        return progress;
    }

    splitText(str: string, maxLinesPerChunk: number): string[] {
        const chunks: string[] = [];
        const lines: string[] = str.split(/\r?\n/);
        let currentChunk: string = '';
        let lineCounter: number = 0;

        for (const line of lines) {
            if (lineCounter < maxLinesPerChunk) {
                currentChunk += line + '\n';
                lineCounter++;
            } else {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
                lineCounter = 1;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }
        return chunks;
    }

    tryMergeChunks(chunks: string[]): string[] {
        const mergedChunks: string[] = [];
        let currentChunk: string = '';

        for (const chunk of chunks) {
            if (currentChunk.length + chunk.length < 2000) {
                currentChunk += '\n' + chunk;
            } else {
                if (currentChunk.length > 0) {
                    mergedChunks.push(currentChunk);
                }
                currentChunk = chunk;
            }
        }

        if (currentChunk.length > 0) {
            mergedChunks.push(currentChunk);
        }
        return mergedChunks;
    }

    private embeddingsPromises: Promise<any>[] = [];
    private thenPromises: Promise<any>[] = [];

    async saveIndexAsync(fileInfo: FileInfo) {
        logger.info(`${this.processFilesCount++} saveIndex start, path: ${fileInfo.path}`);

        try {
            const content = FileService.getFileContent(fileInfo.path);
            // 内容空则忽略处理
            if (!content) {
                logger.info(`vvv ignore saveIndex cause content empty，path: ${fileInfo.path}`);
                return;
            }
            // 非文本文件，不处理
            if (!isTextFile(fileInfo.path)) {
                logger.info(`vvv ignore saveIndex cause isTextFile=false，path: ${fileInfo.path}`);
                return;
            }
            // 非文本内容，不处理
            if (!isTextString(content)) {
                logger.info(`vvv ignore saveIndex cause isTextString=false，path: ${fileInfo.path}`);
                return;
            }

            const model = this.model;
            const fileSha256 = sha256Service.getFileSha256(fileInfo.path);
            const hasIndex = await this.hasIndexV3(fileInfo.path, fileSha256, model);
            if (hasIndex && !this.forceEmbeddingsWhenExists) {
                logger.info(`ignore saveIndex cause hasIndex=true，path: ${fileInfo.path} fileSha256: ${fileSha256}`);
                return;
            }

            // 执行到这里，文件内容应该有变更，如果向量都请求过，而且文件内容没有变更，不会执行到这里
            // 修改为固定32行，保证相同内容的幂等性
            const chunks = this.tryMergeChunks(this.splitText(content, 32));
            if (chunks.length > 50) {
                logger.info(`ignore saveIndex，path: ${fileInfo.path},chunks:${chunks.length}`);
                return;
            }

            const sha256Chunks: { sha256: string, chunk: string }[] = [];        

            for (const chunk of chunks) {
                const sha256 = sha256Service.getStringSha256(chunk);
                sha256Chunks.push({
                    sha256: sha256,
                    chunk: chunk
                });
            }

            const fileSha256s = sha256Chunks.map(item => item.sha256);
            const existsSha256s = await this.embeddingsVectorService.existsEmbeddingsContent(fileSha256s, model);
            
            const embeddingsNotFound = sha256Chunks.filter(item => !existsSha256s.includes(item.sha256));
            const bodyLength = embeddingsNotFound.reduce((acc, cur) => acc + cur.chunk.length, 0);

            const chunksha256s = fileSha256s.join(',');
            logger.info(`fileSha256s: ${fileSha256s.length}, chunksha256s: ${chunksha256s}`);
            logger.info(`embeddingsNotFound: ${embeddingsNotFound.length}, bodyLength: ${bodyLength}`);

            // bodyLength为0，重建文件向量
            if (bodyLength === 0) {
                logger.info(`ignore saveIndex cause bodyLength=0 and rebuild embeddings file，path: ${fileInfo.path}`);
                const embeddingsFile = {
                    filepath: fileInfo.path,
                    name: fileInfo.name,
                    sha256: fileSha256,
                    chunksha256s: chunksha256s,
                    version: 0
                };
                await this.embeddingsFileService.saveEmbeddingsFile(embeddingsFile);
                logger.info(`vvv rebuild saveEmbeddingsFile done, path: ${fileInfo.path}, chunksha256s: ${chunksha256s}`);
                return;
            }

            // 当前时间戳
            const time1 = new Date().getTime();
            
            // 取embeddingsNotFound的chunk：reqChunks
            const reqChunks:string[] = [];
            for (const item of embeddingsNotFound) {
                reqChunks.push(item.chunk);
            }
            const requestId = uuidv4();
            const embeddingsPromise = this.getEmbeddings(reqChunks, fileInfo.path, requestId);
            this.embeddingsPromises.push(embeddingsPromise);

            logger.info(`v1 thenPromises.length: ${this.thenPromises.length}`);
            await Promise.all(this.thenPromises);
            this.thenPromises = []; // 清空 thenPromises 数组

            const thenPromise = embeddingsPromise.then(async (embeddings) => {
                const time2 = new Date().getTime();
                this.embeddingCostTime += time2 - time1;
                // embeddings的内容总长度，元素需要转换为number[]，不能转换的元素长度认为是空，vectorLength是embeddings的元素长度的总和
                // embeddings可能为空，需前置判断
                const vectorLength = embeddings?.reduce((acc, cur) => acc + (Array.isArray(cur) ? cur.length : 0), 0) || 0;
                logger.info(`vvv getEmbeddings done, cost: ${time2 - time1} ms, bodyLength: ${bodyLength}, vectorLength: ${vectorLength}, path: ${fileInfo.path}, requestId: ${requestId}`);
                
                
                if (vectorLength === 0) {
                    logger.error(`vvv ignore saveEmbeddings cause response vectorLength=0, requestId: ${requestId}, path: ${fileInfo.path}`);
                    return ;
                }

                if (embeddings && embeddings.length > 0) {    
                    const records = [];
                    
                    for (let i: number = 0; i < embeddingsNotFound.length; i++) {
                        const item = embeddingsNotFound[i];
                        const vector = embeddings[i] as number[];
                        const fileContent = processChineseLines(item.chunk);

                        if (!Array.isArray(vector) || vector.length === 0) {
                            logger.info(`vvv ignore saveEmbeddings cause vector is error, requestId: ${requestId}, path: ${fileInfo.path}, sha256: ${item.sha256}, vector: ${vector}`);
                            continue;
                        }

                        records.push({
                            id: '',
                            sha256: item.sha256,
                            model: model,
                            vector: vector,
                            status: 1,
                            time: time2,
                            content: fileContent
                        });
                    }

                    await this.embeddingsVectorService.saveEmbeddings(records);
                    const time3 = new Date().getTime();
                    logger.info(`saveEmbeddings done, path: ${fileInfo.path}, records: ${records.length} cost: ${time3 - time2} ms`);

                    // 写入 EmbeddingsFile
                    const embeddingsFile = {
                        filepath: fileInfo.path,
                        name: fileInfo.name,
                        sha256: fileSha256,
                        chunksha256s: chunksha256s,
                        version: 0
                    };
                    await this.embeddingsFileService.saveEmbeddingsFile(embeddingsFile);
                    const time4 = new Date().getTime();
                    logger.info(`saveEmbeddingsFile done, path: ${fileInfo.path}, chunksha256s: ${chunksha256s} cost: ${time4 - time3} ms`);

                    await this.buildWorkspaceEmbeddings(fileInfo.path);
                    const time5 = new Date().getTime();
                    logger.info(`vvv thenPromise buildWorkspaceEmbeddings done, path: ${fileInfo.path} cost: ${time5 - time4} ms`);
                }
                const time6 = new Date().getTime();
                this.indexCostTime += time6 - time2;
                logger.info(`thenPromise ${fileInfo.path} all chunks done, chunks: ${chunks.length}, cost: ${time6 - time2} ms`);
            });
            this.thenPromises.push(thenPromise);
            logger.info(`v2 thenPromises.length: ${this.thenPromises.length}`);
        
            if (this.embeddingsPromises.length >= this.pLimitSize) {
                // 等待embeddingsPromises的首个Promise完成
                await this.embeddingsPromises[0];
                this.embeddingsPromises.shift(); // 移除已完成的Promise
            }
            
            logger.info('v3 embeddingsPromises.length: %s, thenPromises.length: %s, getEmbeddingsCount: %s, embeddingCostTime: %s ms indexCostTime: %s ms',
                this.embeddingsPromises.length, this.thenPromises.length, this.getEmbeddingsCount, this.embeddingCostTime, this.indexCostTime
            );
            
        } catch (error) {
            logger.error(`saveIndex ${fileInfo.path} error: ${error}`);
        } finally {
            this.concurrentCount--;
        }
    }

    private getEmbeddingsCount = 0;

    // 调用getEmbeddings获取Embeddings
    // 增加参数：filepath，并每行日志打印
    async getEmbeddings(chunks: string[], filepath: string, requestId: string): Promise<number[][] | null> {
        logger.info(`getEmbeddings start, requestId: ${requestId}, filepath: ${filepath}, chunks: ${chunks.length} getEmbeddingsCount:${this.getEmbeddingsCount++}`);
        const encodeChunks = chunks.map(chunk => Base64.encode(chunk));
        // const requestId = uuidv4();
        var message = {
            'methodName': 'getEmbeddings',
            'arg': {
                'requestId':requestId,
                'input':encodeChunks,
            }
        };
        logger.info(`getEmbeddings requestId: ${requestId}, filepath: ${filepath}, encodeChunks: ${encodeChunks}`);

        const embeddingsPromise = new Promise<number[][]>((resolve, reject) => {
                    // 存储解析函数
                    this.pendingEmbeddings.set(requestId, resolve);
                    // 超时处理（10秒）
                    const timeout = setTimeout(() => {
                        this.pendingEmbeddings.delete(requestId);
                        resolve([]); // 返回空结果
                    }, 10000);
                    
                });
        
        const messageString = JSON.stringify(message);
        logger.info(`getEmbeddings requestId: ${requestId}, filepath: ${filepath}, messageString: ${messageString}`);

        this.webviewViewProvider.postMessageToWebview({
            command: 'callJavaScript',
            message: messageString
        });
        logger.info(`getEmbeddings postMessageToWebview requestId: ${requestId}`);

        try {
            const response = await embeddingsPromise;
            logger.info(`getEmbeddings response requestId: ${requestId}, filepath: ${filepath} response: ${response}`);
            if (!response) {
                return null;
            }
            return response;
        } catch (error) {
            logger.error(`error requestId: ${requestId} post getEmbeddings error: ${error}`);
            return null;
        } finally {
            this.getEmbeddingsCount--;
            logger.info(`getEmbeddings end, requestId: ${requestId}, filepath: ${filepath}, chunks: ${chunks.length} getEmbeddingsCount:${this.getEmbeddingsCount}`);
        }
    }

    isEmbeddingRequest(requestId:string){
        const resolve = this.pendingEmbeddings.get(requestId);
        if (resolve) {
            return true;
        }
        return false;
    }

    async handleEmbeddingResponse(requestId:string,datas:number[][]){
        const resolve = this.pendingEmbeddings.get(requestId);
        if (!resolve){
            return;
        }

        resolve(datas); 
    }

    // 接口：hasIndexV3(filePath: string)
    async hasIndexV3(filePath: string, sha256: string, model: string): Promise<boolean> {
        const embeddingsFile = await this.embeddingsFileService.findEmbeddingsFile(filePath);
        // 是否有记录
        if (!embeddingsFile){
            logger.info(`hasIndexV3 not found ${filePath}`);
            return false;
        }
        // sha256是否相同
        if (embeddingsFile.sha256 !== sha256){
            logger.info(`hasIndexV3 sha256 not match ${filePath}`);
            return false;
        }

        const chunksha256s = embeddingsFile.chunksha256s.split(',');
        if (chunksha256s.length > 1){
            logger.info(`hasIndexV3 chunksha256s length: ${chunksha256s.length} ${filePath}`);
        }
        const existsSha256s = await this.embeddingsVectorService.existsEmbeddingsContent(chunksha256s, model);
        logger.info(`hasIndexV3 chunksha256s: ${chunksha256s.length}, existsSha256s: ${existsSha256s.length}, ${filePath}`);
        
        return chunksha256s.length === existsSha256s.length;
    }


    async query(vector: number[], query: string): Promise<EmbeddingsFile[] | null> {
        const maxSearchResult = EmbeddingsSettings.getCodeBaseMaxSearchResult();
        
        try {
            const model = this.model;
            const files = await this.embeddingsFileService.queryEmbeddingsFiles(model, vector, maxSearchResult);
            // const results = await this.ldbService.query(vector,processChineseLines(query),maxSearchResult);
            
            if (files.length > 0) {
                return files;
            } else {
                logger.info(`未找到结果。`);
                return null;
            }
        } catch (error) {
            logger.error(`query error: ${error}`);
            return null;
        }
    }

    async queryFiles(vector: number[], query: string): Promise<FileInfo[]> {
        const results = await this.query(vector, query);
        if (!results) return [];

        // 创建文件路径到最新内容的映射
        const fileMap = new Map<string, string>();
        
        for (const result of results) {
            try {
                // 解码文件路径和内容
                const filePath = result.filepath;
                // todo 取代码片段，而不是读整个文件
                const content = FileService.getFileContent(filePath);
                
                // 只保留最新版本的内容
                fileMap.set(filePath, content);
            } catch (error) {
                logger.error(`解码错误: ${error}`);
            }
        }

        // 转换为FileInfo数组
        return Array.from(fileMap, ([filePath, content]) => ({
            name: path.basename(filePath),
            path: filePath,
            content: content,
            mtime:0,
            atime:0
        })).slice(0, 10); // 最多返回10个文件
    }

    async isCodebaseIndexExists() {
        return this.isCodeBaseReady();
    }

    async buildWithCodebaseContext(prompt: string): Promise<FileInfo[]> {
        const requestId = uuidv4();
        const embeddings = await this.getEmbeddings([prompt], 'buildWithCodebaseContext', requestId);
        if (embeddings && embeddings.length > 0) {
            const files = await this.queryFiles(embeddings[0] as number[], prompt);
            logger.info('v2 buildWithCodebaseContext queryFiles: %s', JSON.stringify(files));
            return files;
        }
        return [];
    }

    private async executeScheduledTask() {
        this.isTaskRunning = true;
        logger.info('executeScheduledTask start');
        try {
            

        } catch (error) {
            logger.error("executeScheduledTask error", error);
        } finally {
            this.isTaskRunning = false;
            logger.info('executeScheduledTask end');
        }
    }
}
