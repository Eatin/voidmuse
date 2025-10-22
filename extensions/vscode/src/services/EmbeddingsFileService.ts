// README
// 向量化存储读写文件，依赖EmbeddingsVectorService，且EmbeddingsVectorService不直接暴露给上层
/*
【实体类】：EmbeddingsFile，向量文件，表名：embeddings_files，字段：
1. filepath: string 文件绝对路径（全局唯一）
2. name: string 文件名
3. sha256: string 文件所有内容的sha256值
4. chunksha256s: string 文件片段的sha256值用逗号拼接
5. version: number 版本号，值固定为0
备注：
1. 一个文件可能被切分成多个文件片段，每个文件片段有一个sha256值


【查询】按文件的filepath查询EmbeddingsFile：
接口名：queryEmbeddingsFile()
1. 输入：filepath: string
2. 输出：
    1. 存在：EmbeddingsFile
    2. 不存在：null

【写入】EmbeddingsFile写入LanceDB：
接口名：saveEmbeddingsFile()
1. 输入：EmbeddingsFile
2. 输出：
    1. 成功：true
    2. 失败：false

【写入事务】多个文件片段写入EmbeddingsContent和EmbeddingsFile：
接口名：saveEmbeddingsFileTransaction()
1. 输入文件片段集合，每个片段的字段如下：
    1. filepath: string 文件绝对路径
    2. name: string 文件名
    3. sha256: string 文件片段内容的sha256值
    4. vector: number[] 向量内容
    5. model: string 模型名称
2. 输出：
    1. 成功：true
    2. 失败：false
3. 依赖：src\services\EmbeddingsVectorService.ts
4. 逻辑：
    1. 遍历文件片段集合，每个文件片段调用EmbeddingsVectorService.saveEmbeddings()到LanceDB
    2. 文件片段集合构造一个EmbeddingsFile，写入LanceDB


【查询】按prompt的vector检索文件：
接口名：queryEmbeddingsFile()
1. 输入：model: string, vector: number[], limit: number
2. 输出：EmbeddingsFile[]
3. 依赖：src\services\EmbeddingsVectorService.ts
4. 逻辑：
    1. 调用EmbeddingsVectorService.queryEmbeddings()，获取EmbeddingsQueryResult[]，取得sha256[]
    2. 根据sha256[]查询EmbeddingsFile，取得EmbeddingsFile[]，去重后返回

【接口定义】EmbeddingsVectorService：
    1. async queryEmbeddings(model: string, vector: number[], limit: number): Promise<EmbeddingsQueryResult[]> 
    2. async saveEmbeddings(model: string, vector: number[], sha256: string): Promise<boolean>


【定时任务】清理EmbeddingsFile：
1. 遍历embeddings_files的所有文件，判断filepath的文件是否存在
2. 如果不存在，删除embeddings_files的记录
*/

import * as lancedb from '@lancedb/lancedb';
import { createLogger } from './logger';
import { EmbeddingsVectorService, EmbeddingsContent, EmbeddingsQueryResult } from './EmbeddingsVectorService';

const logger = createLogger('EmbeddingsFileService');
const arrow = require("apache-arrow");

/**
 * EmbeddingsFile entity class
 */
export interface EmbeddingsFile {
    filepath: string;        // Absolute file path (globally unique)
    name: string;           // File name
    sha256: string;         // SHA256 hash of entire file content
    chunksha256s: string;   // Comma-separated string of SHA256 hashes for file chunks
    version: number;        // Version, fixed to 0
}

/**
 * EmbeddingsFileService for managing file metadata in LanceDB
 */
export class EmbeddingsFileService {
    private dbConn!: lancedb.Connection;
    private tableName: string = 'embeddings_files';
    private dbPath: string;
    private workspacePath!: string;
    private workspacePathWhereEscape!: string;
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;
    private vectorService: EmbeddingsVectorService;
    // indexExists: map<TableName, boolean>
    private indexExists = new Map<string, boolean>();

    /**
     * Constructor
     * @param dbPath Database path
     * @param vectorService EmbeddingsVectorService instance
     */
    constructor(dbPath: string, workspacePath: string, vectorService: EmbeddingsVectorService) {
        this.dbPath = dbPath;
        this.workspacePath = workspacePath;
        this.workspacePathWhereEscape = this.workspacePath.replace(/\\/g, "\\\\");
        logger.info(`vvv EmbeddingsFileService constructor, dbPath: ${this.dbPath}, workspacePath: ${this.workspacePath}, workspacePathWhereEscape: ${this.workspacePathWhereEscape}`);
        this.vectorService = vectorService;
        this.initPromise = this.initializeLanceDB();
        this.initPromise.then(() => {
            this.isInitialized = true;
            logger.info(`EmbeddingsFileService initialized successfully`);
        }).catch(err => {
            logger.error(`EmbeddingsFileService initialization failed: ${err}`);
            console.error(err);
        });
    }

    /**
     * Ensure initialization is complete
     */
    private async ensureInitialized() {
        if (!this.isInitialized && this.initPromise) {
            await this.initPromise;
        }
    }

    /**
     * Initialize LanceDB connection and table
     */
    private async initializeLanceDB() {
        logger.info(`Initializing LanceDB at path: ${this.dbPath}`);
        this.dbConn = await lancedb.connect(this.dbPath);
        logger.info(`Connected to LanceDB`);

        const tables = await this.dbConn.tableNames();
        if (!tables.includes(this.tableName)) {
            const schema = new arrow.Schema([
                new arrow.Field("filepath", new arrow.Utf8()),
                new arrow.Field("name", new arrow.Utf8()),
                new arrow.Field("sha256", new arrow.Utf8()),
                new arrow.Field("chunksha256s", new arrow.Utf8()),
                new arrow.Field("version", new arrow.Int32())
            ]);
            await this.dbConn.createEmptyTable(this.tableName, schema, { mode: "create" });
            logger.info(`Created new table: ${this.tableName}`);
        }

        await this.logAll();
        await this.logWorkspace();
        
        logger.info(`EmbeddingsFileService initialized successfully`);
    }

    // 打印当前所有数据，打印总行数
    async logAll() {
        const table = await this.dbConn.openTable(this.tableName);
        const data = await table.query().select(['filepath']).toArray();
        logger.info(`Current all data, total: ${data.length}`);
    }

    async logWorkspace() {
        const table = await this.dbConn.openTable(this.tableName);
        const data = await table.query().where(`filepath LIKE '${this.workspacePathWhereEscape}%'`).select(['filepath']).toArray();
        logger.info(`Current workspace data, total: ${data.length}: ${data.map((item, index) => `${index + 1}. ${item.filepath}`).join('\n')}`);
    }


    /**
     * Find file by filepath
     * @param filepath File path
     * @returns EmbeddingsFile or null
     */
    async findEmbeddingsFile(filepath: string): Promise<EmbeddingsFile | null> {
        try {
            await this.ensureInitialized();
            
            if (!filepath || typeof filepath !== 'string') {
                logger.error(`Invalid filepath: ${filepath}`);
                return null;
            }
            
            const table = await this.dbConn.openTable(this.tableName);
            await this.createIndexes(table);

            const files = await table.query().where(`filepath = '${this.escape(filepath)}'`).toArray();
            return files.length > 0 ? files[0] : null;
        } catch (error) {
            logger.error(`Error querying embeddings file: ${error}`);
            return null;
        }
    }

    // function: 创建索引
    private async createIndexes(table: lancedb.Table){
        try {
            const indexExists = this.indexExists.get(table.name);
            if (indexExists) {
                return;
            }

            logger.info(`createIndexes table.name: ${table.name}`);
            this.indexExists.set(table.name, true);

            await table.createIndex("filepath", {config: lancedb.Index.btree()});
        } catch (error) {
            logger.error(`Failed to create index: ${error}`);
            console.error(error);
        }
    }

    // 批次大小
    private batchSize = 10;
    // records队列
    private recordsQueue: EmbeddingsFile[] = [];

    /**
     * Save EmbeddingsFile to LanceDB
     * 每10个文件批量插入，这可能会导致最多存在9个文件没有插入，暂时不考虑这种情况。
     * @param file EmbeddingsFile to save
     * @returns boolean indicating success
     */
    async saveEmbeddingsFile(file: EmbeddingsFile): Promise<boolean> {
        try {
            await this.ensureInitialized();

            if (!this.validateEmbeddingsFile(file)) {
                logger.error(`Invalid EmbeddingsFile format: ${JSON.stringify(file)}`);
                return false;
            }

            // 加入队列
            this.recordsQueue.push(file);

            // 队列数小于批次大小，不处理
            if (this.recordsQueue.length < this.batchSize) {
                logger.info(`vvv saveEmbeddingsFile to recordsQueue, queueSize: ${this.recordsQueue.length}`);
                return true;
            }

            const time0 = Date.now();
            const table = await this.dbConn.openTable(this.tableName);

            logger.info(`vvv before size: ${this.recordsQueue.length}`);
            // 取队列前batchSize个元素
            const records = this.recordsQueue.splice(0, this.batchSize).map(item => ({
                filepath: item.filepath,
                name: item.name,
                sha256: item.sha256,
                chunksha256s: item.chunksha256s,
                version: 0
            }));

            logger.info(`vvv after size: ${this.recordsQueue.length}`);

            await table.mergeInsert('filepath')
                    .whenMatchedUpdateAll()
                    .whenNotMatchedInsertAll()
                    .execute(records);
            const time2 = Date.now();
            logger.info(`v3 vvv saveEmbeddingsFile time: ${time2 - time0}ms, filepath: ${file.filepath}, records length: ${records.length}`);

            return true;
        } catch (error) {
            logger.error(`Error saveEmbeddingsFile, filepath: ${file.filepath} ${error}`);
            return false;
        }
    }

    /**
     * Save multiple file chunks and EmbeddingsFile in a transaction
     * @param filepath 文件绝对路径
     * @param name 文件名
     * @param sha256 文件SHA256哈希值
     * @param model 模型名称
     * @param chunks 文件分段的数组
     *  chunks.sha256: 文件分段的sha256
     *  chunks.vector: 文件分段的向量
     * @returns boolean indicating success
     */
    async saveEmbeddingsFileTransaction(filepath: string, name: string, sha256: string, model: string, chunks: Array<{
        sha256: string;
        vector: number[];
    }>): Promise<boolean> {
        try {
            await this.ensureInitialized();

            // Validate input parameters
            if (!filepath || typeof filepath !== 'string') {
                logger.error(`Invalid filepath: ${filepath}`);
                return false;
            }
            if (!name || typeof name !== 'string') {
                logger.error(`Invalid name: ${name}`);
                return false;
            }
            if (!sha256 || typeof sha256 !== 'string' || sha256.length !== 64) {
                logger.error(`Invalid sha256: ${sha256}`);
                return false;
            }
            if (!model || typeof model !== 'string') {
                logger.error(`Invalid model: ${model}`);
                return false;
            }
            if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
                logger.error('Empty or invalid chunks array');
                return false;
            }

            // Validate all chunks
            for (const chunk of chunks) {
                if (!this.validateChunk(chunk)) {
                    logger.error(`Invalid chunk format: ${JSON.stringify(chunk)}`);
                    return false;
                }
            }

            // Save chunks to EmbeddingsContent via EmbeddingsVectorService
            for (const chunk of chunks) {
                const content: EmbeddingsContent = {
                    id: `${chunk.sha256}.${model}`,
                    sha256: chunk.sha256,
                    model: model,
                    vector: chunk.vector,
                    status: 1,
                    time: Date.now(),
                    content: ''
                };
                const success = await this.vectorService.saveEmbeddings([content]);
                if (!success) {
                    logger.error(`Failed to save chunk: ${chunk.sha256}`);
                    return false;
                }
            }

            // Construct and save EmbeddingsFile
            const file: EmbeddingsFile = {
                filepath: filepath,
                name: name,
                sha256: sha256,
                chunksha256s: chunks.map(chunk => chunk.sha256).join(','),
                version: 0
            };
            logger.info(`Constructed EmbeddingsFile with chunksha256s: ${file.chunksha256s}`);

            const saveResult = await this.saveEmbeddingsFile(file);
            if (!saveResult) {
                logger.error(`Failed to save EmbeddingsFile for filepath: ${file.filepath}`);
                return false;
            }

            logger.info(`Successfully saved ${chunks.length} chunks and EmbeddingsFile`);
            return true;
        } catch (error) {
            logger.error(`Error in saveEmbeddingsFileTransaction: ${error}`);
            return false;
        }
    }

    /**
     * Query EmbeddingsFile by vector
     * @param model Model name
     * @param vector Query vector
     * @param limit Maximum number of results
     * @returns Array of EmbeddingsFile
     */
    async queryEmbeddingsFiles(model: string, vector: number[], limit: number): Promise<EmbeddingsFile[]> {
        try {
            await this.ensureInitialized();

            if (!model || !Array.isArray(vector) || vector.length === 0 || !limit || limit <= 0) {
                logger.error(`Invalid query parameters: model=${model}, vector=${vector}, limit=${limit}`);
                return [];
            }

            // Query EmbeddingsVectorService to get chunk SHA256s
            const queryResults = await this.vectorService.queryEmbeddings(model, vector, limit);
            if (queryResults.length === 0) {
                logger.info('No matching chunks found');
                return [];
            }

            const sha256s = queryResults.map(result => result.sha256);
            logger.info(`Querying with sha256s: ${sha256s}`);
            const table = await this.dbConn.openTable(this.tableName);
            const uniqueFiles: EmbeddingsFile[] = [];
            const seenFilepaths = new Set<string>();

            // Query for each sha256 using LIKE with precise pattern
            // workspace匹配filepath
            for (const sha256 of sha256s) {
                const files = await table.query()
                    .where(`chunksha256s LIKE '%${sha256}%' AND filepath LIKE '${this.workspacePathWhereEscape}%'`)
                    .toArray();
                logger.info(`Found ${files.length} files for sha256: ${sha256}`);

                for (const file of files) {
                    if (!seenFilepaths.has(file.filepath)) {
                        uniqueFiles.push({
                            filepath: file.filepath,
                            name: file.name,
                            sha256: file.sha256,
                            chunksha256s: file.chunksha256s,
                            version: file.version
                        });
                        seenFilepaths.add(file.filepath);
                    }
                }
            }

            logger.info(`vvv Found ${uniqueFiles.length} unique files for query`);
            // 打印filepath
            logger.info(`vvv Query results: ${uniqueFiles.map(file => file.filepath).join('\n')}`);
            return uniqueFiles;
        } catch (error) {
            logger.error(`Error querying EmbeddingsFile: ${error}`);
            return [];
        }
    }

    /**
     * Clean up outdated EmbeddingsFile records
     */
    async cleanupEmbeddingsFiles(): Promise<void> {
        try {
            await this.ensureInitialized();
            
            const fs = require('fs').promises;
            const path = require('path');
            const table = await this.dbConn.openTable(this.tableName);

            // Get all EmbeddingsFile records
            const allFiles = await table.query().toArray();
            logger.info(`Found ${allFiles.length} records in embeddings_files table`);

            // Check each file's existence and delete if it doesn't exist
            for (const file of allFiles) {
                logger.info(`Processing file: ${file.filepath}`);

                const filePath = path.resolve(file.filepath);
                logger.info(`Checking file existence for: ${filePath}`);

                try {
                    await fs.access(filePath, fs.constants.F_OK);
                    logger.debug(`File exists: ${filePath}`);
                } catch (error) {
                    logger.info(`File does not exist, deleting record for: ${filePath}`);
                    await table.delete(`filepath = '${file.filepath}'`);
                }
            }

            logger.info(`Cleanup completed`);
        } catch (error) {
            logger.error(`Error cleaning up EmbeddingsFiles: ${error}`);
        }
    }

    /**
     * Validate EmbeddingsFile format
     * @param file EmbeddingsFile to validate
     * @returns boolean indicating validity
     */
    private validateEmbeddingsFile(file: EmbeddingsFile): boolean {
        if (!file.filepath || typeof file.filepath !== 'string') return false;
        if (!file.name || typeof file.name !== 'string') return false;
        if (!file.sha256 || typeof file.sha256 !== 'string' || file.sha256.length !== 64) return false;
        if (typeof file.chunksha256s !== 'string') return false; // Renamed to lowercase
        if (typeof file.version !== 'number') return false;
        return true;
    }

    /**
     * Validate chunk format
     * @param chunk Chunk object to validate
     * @returns boolean indicating validity
     */
    private validateChunk(chunk: { sha256: string; vector: number[] }): boolean {
        if (!chunk.sha256 || typeof chunk.sha256 !== 'string' || chunk.sha256.length !== 64) return false;
        if (!Array.isArray(chunk.vector) || chunk.vector.length === 0) return false;
        return true;
    }

    /**
     * Generate SHA256 for file from chunks
     * @param chunks Array of chunks
     * @returns Combined SHA256 hash
     */
    private generateFileSha256(chunks: Array<{ sha256: string }>): string {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        chunks.sort((a, b) => a.sha256.localeCompare(b.sha256));
        chunks.forEach(chunk => hash.update(chunk.sha256));
        return hash.digest('hex');
    }

    /**
     * Calculate SHA256 for file content
     * @param content File content buffer
     * @returns SHA256 hash
     */
    private async calculateSha256(content: Buffer): Promise<string> {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    // escape where条件参数
    private escape(param: string) {
        return param.replace(/'/g, "''");
    }

}

/**
 * Test function for EmbeddingsFileService
 */
export async function testEmbeddingsFileService() {
    try {
        const os = require('os');
        const path = require('path');
        const fs = require('fs').promises;
        const testDbPath = path.join(os.tmpdir(), 'embeddings_file_test_db');
        const testWorkspacePath = path.join(os.tmpdir(), 'embeddings_file_test_workspace');
        
        // Ensure test directory
        await fs.mkdir(testDbPath, { recursive: true });

        // Initialize services
        const vectorService = new EmbeddingsVectorService(testDbPath, 'test-model');
        const fileService = new EmbeddingsFileService(testDbPath, testWorkspacePath, vectorService);

        // Test data
        const testFile: EmbeddingsFile = {
            filepath: 'D:/test/file.txt',
            name: 'file.txt',
            sha256: '1234567890123456789012345678901234567890123456789012345678901234',
            chunksha256s: '1234567890123456789012345678901234567890123456789012345678901234,9876543210987654321098765432109876543210987654321098765432109876',
            version: 0
        };

        const testChunks = [
            {
                sha256: '1234567890123456789012345678901234567890123456789012345678901234',
                vector: Array(1536).fill(0).map((_, i) => (i % 100) / 100.0)
            },
            {
                sha256: '9876543210987654321098765432109876543210987654321098765432109876',
                vector: Array(1536).fill(0).map((_, i) => (i * 2 % 100) / 100.0)
            }
        ];

        // Test checkEmbeddingsFile
        console.log('Testing findEmbeddingsFile...');
        let exists = await fileService.findEmbeddingsFile(testFile.filepath);
        console.log(`Check result (should be null): ${exists}`);

        // Test saveEmbeddingsFile
        console.log('Testing saveEmbeddingsFile...');
        const saveResult = await fileService.saveEmbeddingsFile(testFile);
        console.log(`Save result: ${saveResult}`);

        // Verify file exists
        exists = await fileService.findEmbeddingsFile(testFile.filepath);
        console.log(`Check result (should be true): ${exists}`);

        // Test saveEmbeddingsFileTransaction
        console.log('Testing saveEmbeddingsFileTransaction...');
        const transactionResult = await fileService.saveEmbeddingsFileTransaction(
            testFile.filepath,
            testFile.name,
            testFile.sha256,
            'test-model',
            testChunks
        );
        console.log(`Transaction result: ${transactionResult}`);

        // Test queryEmbeddingsFile
        console.log('Testing queryEmbeddingsFile...');
        const queryResults = await fileService.queryEmbeddingsFiles('test-model', testChunks[0].vector, 10);
        console.log(`Query results: ${JSON.stringify(queryResults)}`);

        // Test cleanup
        console.log('Testing cleanupEmbeddingsFiles...');
        await fileService.cleanupEmbeddingsFiles();
        console.log('Cleanup completed');

        console.log('All tests completed!');
        return true;
    } catch (error) {
        console.error(`Test failed: ${error}`);
        return false;
    }
}

