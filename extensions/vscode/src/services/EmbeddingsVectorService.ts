// README
// 
/*
数据存储：
sha256向量常量表，实体类名称：EmbeddingsContent，对应的LanceDB表名：embeddings_content
注意：id字段不需要对外暴露，外部仅需要sha256.model，id在内部拼接
包含字段：
1. id：sha256.model，向量的唯一标识，数据可按id覆盖保存，id=sha256.model，model=模型名称，sha256=文件内容（或片段）的sha256值
2. sha256：文件内容（或片段）的sha256值
3. model：模型名称
4. vector：向量内容
5. status：1：可见、0：不可见，应有定时任务定时刷新，也是此表唯一可变字段
6. time：创建时间

接口：
1. 查询向量是否存在：根据sha256、model查询向量是否存在
    1. 接口名称：existsEmbeddingsContent
    2. 入参：sha256、model
    3. 出参：true/false
    4. 逻辑：
        1. 构造id：sha256.model
        2. 查询LanceDB表embeddings_$model，查询条件：id=sha256.model，返回结果条数
        3. 如果结果条数为0，返回false
        4. 如果结果条数大于0，返回true

2. 保存向量：保存一个向量，保存到LanceDB
    1. 接口名称：saveEmbeddingsContent
    2. 入参：EmbeddingsContent
    3. 出参：新增/覆盖结果：true/false
    4. 逻辑：
        1. 判断EmbeddingsContent的所有字段的格式是否正常，不正常则返回false
        2. 构造id：sha256.model
        3. 覆盖保存EmbeddingsContent到LanceDB，返回true
        4. 如果保存失败，返回false

3. 更新向量状态：根据sha256、model更新向量的status字段
    1. 接口名称：updateEmbeddingsContentStatus
    2. 入参：sha256、model、status
    3. 出参：更新结果条数，若失败返回-1
    4. 逻辑：
        1. 构造id：sha256.model
        2. 更新LanceDB表embeddings_$model，查询条件：id=sha256.model，更新字段：status
        3. 如果执行成功，返回更新结果条数
        4. 如果执行失败，返回-1

4. 查询向量：根据model、vector查询向量集合
    1. 接口名称：queryEmbeddingsContent
    2. 入参：model、vector、limit
    3. 出参：EmbeddingsQueryResult[]
        EmbeddingsQueryResult包含字段：
            1. sha256：向量的唯一标识
            2. score：相关度，0-1之间的浮点数
    4. 逻辑：
        1. 构造查询条件：model、vector，限定status=1
        2. 查询LanceDB表embeddings_$model，返回limit条记录
        3. 如果查询结果为空，返回空集合
        4. 如果查询结果不为空，返回EmbeddingsQueryResult集合
*/

import * as lancedb from '@lancedb/lancedb';
import { createLogger } from './logger';
const arrow = require("apache-arrow");
const logger = createLogger('EmbeddingsVectorService');

/**
 * 向量内容实体类
 */
export interface EmbeddingsContent {
    id: string;          // 向量的唯一标识
    sha256: string;      // 文件内容（或片段）的sha256值
    model: string;       // 模型名称
    vector: number[];    // 向量内容
    status: number;      // 1：可见、0：不可见
    time: number;        // 创建时间
    content: string;     // 片段内容
}

/**
 * 向量查询结果
 */
export interface EmbeddingsQueryResult {
    sha256: string;      // 文件内容（或片段）的sha256值
    distance: number;    // 距离。值越小，说明查询向量与该记录的向量越相似
}

/**
 * 向量数据库服务
 */
export class EmbeddingsVectorService {
    private dbConn!: lancedb.Connection;
    // private table!: lancedb.Table;
    private dbPath: string;
    // 表名前缀，后缀是model去除非字母数字的字符
    private modelTableNamePrefix = 'embeddingsmodel_';
    private workspaceTableNamePrefix = 'embeddingsworkspace_';
    private workspaceName: string;
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;
    // indexExists: map<TableName, boolean>
    private indexExists = new Map<string, boolean>();
    // targetTable是否ready
    private targetTableReady = false;
    // 保存model表批次大小
    private saveBatchSize = 100;
    // 复制workspace批次大小
    private copyBatchSize = 100;

    /**
     * 构造函数
     * @param dbPath 数据库路径
     */
    constructor(dbPath: string, workspaceName: string) {
        this.dbPath = dbPath;
        logger.info(`dbPath: ${this.dbPath}`);

        this.workspaceName = workspaceName;
        logger.info(`workspaceName: ${this.workspaceName}`);

        // 启动初始化但不在构造函数中等待
        this.initPromise = this.initializeLanceDB();
        this.initPromise.then(() => {
            this.isInitialized = true;
            logger.info(`EmbeddingsVectorService initialized successfully`);
        }).catch(err => {
            logger.error(`EmbeddingsVectorService initialization failed: ${err}`);
            console.error(err);
        });
    }

    /**
     * 确保初始化完成的辅助方法
     */
    private async ensureInitialized() {
        if (!this.isInitialized && this.initPromise) {
            await this.initPromise;
        }
    }

    /**
     * 初始化LanceDB
     */
    private async initializeLanceDB() {
        logger.info(`Initializing LanceDB at path: ${this.dbPath}`);
        // 连接到本地 LanceDB
        this.dbConn = await lancedb.connect(this.dbPath);
        logger.info(`Connected to LanceDB`);

        // 检查表是否存在
        const tables = await this.dbConn.tableNames();
        logger.info(`tableNames: ${tables}`);

        await this.dropWorkspaceTable();
        logger.info(`dropWorkspaceTable, workspaceName: ${this.workspaceName}`);
    }

    /**
     * 设置批次大小，当workspace的文件都embeddings完成后，可再设置批次大小为1。
     * 每次修改文件后，由于batchSize为1，都可以马上保存队列的所有数据。
     * @param batchSize 
     */
    setBatchSize(batchSize: number) {
        this.saveBatchSize = batchSize;
        this.copyBatchSize = batchSize;
    }

    /**
     * 检查向量是否存在
     * 修改：改为批量接口，返回存在的sha256
     * @param sha256s sha256数组
     * @param model 
     * @returns 
     */
    async existsEmbeddingsContent(sha256s: string[], model: string): Promise<string[]> {
        try {
            await this.ensureInitialized();

            if (!sha256s || sha256s.length === 0) {
                return [];
            }

            if (!this.validateModel(model)) {
                return [];
            }
        
            sha256s = sha256s.filter(sha256 => this.validateSha256(sha256));
            if (sha256s.length === 0) {
                return [];
            }

            const tableName = this.getModelTableName(model);
            const table = await this.dbConn.openTable(tableName);
            const result = await table.query().where(`sha256 in (${sha256s.map(sha256 => `'${sha256}'`).join(',')})`).select(['sha256']).toArray();
            logger.info(`existsEmbeddingsContent count: ${result.length} result: ${JSON.stringify(result)}`);
            return result.map(r => r.sha256);
        } catch (error) {
            logger.error(`Failed to check embeddings content existence: ${error}`);
            console.error(error);
            return [];
        }
    }

    // EmbeddingsContent队列批量处理
    private embeddingsContentQueue: EmbeddingsContent[] = [];

    /**
     * 批量保存向量，计算各阶段耗时
     * @param contents 向量内容数组
     * @returns 保存结果
     */
    async saveEmbeddings(contents0: EmbeddingsContent[]): Promise<boolean> {
        try {
            await this.ensureInitialized();

            if (!contents0 || contents0.length === 0) {
                logger.error(`saveEmbeddings empty contents`);
                return false;
            }

            // 验证字段格式
            for (const content of contents0) {
                if (!this.validateEmbeddingsContent(content)) {
                    logger.error(`Invalid EmbeddingsContent format: ${JSON.stringify(content)}`);
                    return false;
                }
            }

            // 加入队列
            this.embeddingsContentQueue.push(...contents0);

            const batchSize = this.saveBatchSize;
            // 批量处理
            if (this.embeddingsContentQueue.length < batchSize) {
                logger.info(`vvv embeddingsContentQueue.size: ${this.embeddingsContentQueue.length}`);
                return true;
            }
            
            const contents = this.embeddingsContentQueue.splice(0, batchSize);
            logger.info(`vvv embeddingsContentQueue.size: ${this.embeddingsContentQueue.length}, contents.length: ${contents.length}`);

            const tableName = this.getModelTableName(contents[0].model);
            const records = [];
            for (const content of contents) {
                const id = `${content.sha256}.${content.model}`;
                records.push({
                    id: id,
                    sha256: content.sha256,
                    model: content.model,
                    vector: content.vector,
                    status: content.status,
                    time: content.time
                });
            }

            const tables = await this.dbConn.tableNames();
            let table;
            if (!tables.includes(tableName)) {
                table = await this.dbConn.createTable(tableName, records, { mode: "create" },);
                logger.info(`saveEmbeddings createTable tableName: ${tableName} records.length: ${records.length}`);
            }
            else {
                const time0 = new Date().getTime();
                table = await this.dbConn.openTable(tableName);
                // 插入或替换
                await table.mergeInsert("id")
                    .whenMatchedUpdateAll()
                    .whenNotMatchedInsertAll()
                    .execute(records);
                const time2 = new Date().getTime();
                logger.info(`saveEmbeddings mergeInsert time: ${time2 - time0} ms`);
            }
        
            const time3 = new Date().getTime();
            await this.createIndexes(table);
            const time4 = new Date().getTime();
            logger.info(`saveEmbeddings createIndexes time: ${time4 - time3} ms`);

            const rowCount = await table.countRows();
            const time5 = new Date().getTime();
            logger.info(`saveEmbeddings countRows, time: ${time5 - time4} ms, rowCount: ${rowCount}`);

            return true;
        } catch (error) {
            logger.error(`Failed to save embeddings: ${error}`);
            console.error(error);
            return false;
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

            await table.createIndex("id", {config: lancedb.Index.btree()});
            await table.createIndex("sha256", {config: lancedb.Index.btree()});

            const indices = await table.listIndices();
            logger.info(`createIndexes table.name: ${table.name} indices: ${JSON.stringify(indices)}`);
            
        } catch (error) {
            logger.error(`Failed to create index: ${error}`);
            console.error(error);
        }
    }

    /**
     * 获取表名
     * @param model 模型名称
     * @returns 表名
     */
    private getModelTableName(model: string){
        return this.modelTableNamePrefix + model.replace(/\W+/g, '');
    }

    private getWorkspaceTableName(workspaceName: string){
        return this.workspaceTableNamePrefix + workspaceName.replace(/\W+/g, '');
    }

    /**
     * drop工作空间表，重建工作空间的embeddings表
     */
    private async dropWorkspaceTable(){
        try {
            const tableName = this.getWorkspaceTableName(this.workspaceName);
            await this.dbConn.dropTable(tableName);
            logger.info(`Dropped table: ${tableName}, workspaceName: ${this.workspaceName}`);
        } catch (error) {
            logger.error(`Failed to drop workspace table: ${error}`);
            console.error(error);
        }
    }

    // sha256s队列，批量写入
    private sha256sQueue: string[] = [];

    /**
     * 从model表复制数据到workspace表
     * @param model 模型名称
     * @param sha256s sha256数组
     */
    async copyDataToWorkspaceTable(model: string, sha256s0: string[]){
        try {
            await this.ensureInitialized();
            const time0 = Date.now();

            // 批量处理sha256s
            this.sha256sQueue.push(...sha256s0);

            const batchSize = this.copyBatchSize;
            if (this.sha256sQueue.length < batchSize) {
                logger.info(`vvv sha256sQueue.size: ${this.sha256sQueue.length}`);
                return;
            }

            const batchSha256s = this.sha256sQueue.splice(0, batchSize);
            logger.info(`vvv sha256sQueue.size: ${this.sha256sQueue.length}, batchSha256s.size: ${batchSha256s.length}`);

            const sourceTableName = this.getModelTableName(model);
            const sourceTable = await this.dbConn.openTable(sourceTableName);
            await this.createIndexes(sourceTable);
            logger.info(`sourceTableName: ${sourceTableName} batchSha256s.length: ${batchSha256s.length}`);

            const targetTableName = this.getWorkspaceTableName(this.workspaceName);
            const exists = await this.existsTable(targetTableName);
            logger.info(`targetTableName: ${targetTableName}, exists: ${exists}`);

            let targetTable;
        
            // 批量查询sourceTable，插入内容到targetTable
            const embeddings = await sourceTable.query().where(`sha256 in (${batchSha256s.map(sha256 => `'${sha256}'`).join(',')})`).toArrow();
            if (embeddings) {
                if (!exists) {
                    targetTable = await this.dbConn.createTable(targetTableName, embeddings, { mode: "create" });
                }
                else {
                    targetTable = await this.dbConn.openTable(targetTableName);
                    await targetTable.add(embeddings);
                    logger.info(`vvv copyDataToWorkspaceTable add, batchSha256s.length: ${batchSha256s.length}`);
                }
            }

            if (targetTable) {
                await this.createIndexes(targetTable);
                // const rowCount = await targetTable.countRows();
                // logger.info(`targetTable total rowCount: ${rowCount}`);
            }
            const time4 = Date.now();
            logger.info(`copyDataToWorkspaceTable, ${time4 - time0}ms : ${targetTableName} batchSha256s.length: ${batchSha256s.length}`);
    
        } catch (error) {
            logger.error(`Failed to copy data to new table: ${error}, workspaceName: ${this.workspaceName}`);
            console.error(error);
        }
    }

    /**
     * 表是否存在
     */
    async existsTable(tableName: string): Promise<boolean> {
        try {
            await this.ensureInitialized();
            const tableNames = await this.dbConn.tableNames();
            return tableNames.includes(tableName);
        } catch (error) {
            logger.error(`Failed to check table existence: ${error}`);
            console.error(error);
            return false;
        }
    }

    /**
     * 验证向量内容格式
     * @param content 向量内容
     * @returns 验证结果
     */
    private validateEmbeddingsContent(content: EmbeddingsContent): boolean {
        // 验证sha256
        if (!this.validateSha256(content.sha256)) {
            return false;
        }
        
        // 验证model
        if (!this.validateModel(content.model)) {
            return false;
        }
        
        // 验证content
        if (!Array.isArray(content.vector) || content.vector.length === 0) {
            return false;
        }
        
        // 验证status
        if (content.status !== 0 && content.status !== 1) {
            return false;
        }
        
        // 验证time
        if (!content.time || typeof content.time !== 'number') {
            return false;
        }
        
        return true;
    }

    // validate sha256
    private validateSha256(sha256: string): boolean {
        if (!sha256 || typeof sha256 !== 'string' || sha256.length !== 64) {
            return false;
        }
        return true;
    }

    // validate model
    private validateModel(model: string): boolean {
        if (!model || typeof model !== 'string') {
            return false;
        }
        return true;
    }

    /**
     * 更新向量状态
     * @param model 模型名称
     * @param sha256 文件sha256值
     * @param status 状态值
     * @returns 更新结果
     */
    async updateEmbeddingsStatus(model: string, sha256: string, status: number): Promise<number> {
        try {
            await this.ensureInitialized();
            
            // 验证参数
            if (!sha256 || typeof sha256 !== 'string' || sha256.length !== 64) {
                logger.error(`Invalid sha256: ${sha256}`);
                return -1;
            }
            
            if (status !== 0 && status !== 1) {
                logger.error(`Invalid status: ${status}`);
                return -1;
            }
            
            // 构造id
            const id = `${sha256}.${model}`;
            
            // 更新状态
            // table.update({where:"x = 2", values:{"vector": [10, 10]}})
            const tableName = this.getModelTableName(model);
            const table = await this.dbConn.openTable(tableName);            
            logger.info(`before update table total rowCount: ${await table.countRows()}`);

            const updateResult = await table.update({where: `id = '${id}'`, values: {"status": status}});

            logger.info(`after update table total rowCount: ${await table.countRows()}`);
            if (updateResult){
                const updated = updateResult.rowsUpdated;
                logger.info(`Updated status for id: ${id} to ${status}, updateResult: ${JSON.stringify(updateResult)}`);
                return updated;
            }
        } catch (error) {
            logger.error(`Error updating embeddings status: ${error}`);    
        }

        logger.error(`Failed to update status for sha256: ${sha256}, model: ${model}`);
        return -1;
    }

    /**
     * 查询向量
     * @param model 模型名称
     * @param vector 查询向量
     * @param limit 限制条数
     * @returns 查询结果
     */
    async queryEmbeddings(model: string, vector: number[], limit: number): Promise<EmbeddingsQueryResult[]> {
        try {
            await this.ensureInitialized();
            
            // 验证参数
            if (!model || typeof model !== 'string') {
                logger.error(`Invalid model: ${model}`);
                return [];
            }
            
            if (!Array.isArray(vector) || vector.length === 0) {
                logger.error(`Invalid vector: ${vector}`);
                return [];
            }
            
            if (!limit || typeof limit !== 'number' || limit <= 0) {
                limit = 10; // 默认值
            }
            
            // 查询向量，查询workspace表
            const tableName = this.getWorkspaceTableName(this.workspaceName);
            const table = await this.dbConn.openTable(tableName);
            // 查询的距离类型，是个todo的优化项
            // distanceType?: "l2" | "cosine" | "dot";
            const results = await table.query()
                .where(`status = 1`)
                .nearestTo(vector)
                .distanceType('cosine')
                .limit(limit)
                .toArray();
            console.log(`Query results: ${results.length}`);
            
            // 转换结果
            const queryResults: EmbeddingsQueryResult[] = results.map(item => ({
                sha256: item.sha256,
                distance: item._distance
            }));
            logger.info(`Query results: ${queryResults.length} ${JSON.stringify(queryResults)}`);

            queryResults.sort((a, b) => a.distance - b.distance);
            const filteredResults = queryResults.filter(item => item.distance < 0.5);
            logger.info(`Filtered results: ${filteredResults.length} ${JSON.stringify(filteredResults)}`);
            
            // 返回queryResults，暂不返回按距离过滤的结果
            logger.info(`Query returned ${queryResults.length} results for model: ${model}`);
            return queryResults;
        } catch (error) {
            logger.error(`Error querying embeddings: ${error}`);
            console.error(error);
            return [];
        }
    }

    async dropTable(model: string){
        await this.ensureInitialized();

        const tableName = this.getModelTableName(model);
        await this.dbConn.dropTable(tableName);
    }

}

// 测试代码
export async function testEmbeddingsDbService() {
    try {
        // 创建测试目录
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        const testDbPath = 'D:\\git.liveplatform\\ai-chat\\extensions\\vscode\\embeddings_test_db';
        console.log(`testDbPath: ${testDbPath}`);
        
        // 确保目录存在
        if (!fs.existsSync(testDbPath)) {
            fs.mkdirSync(testDbPath, { recursive: true });
        }
        
        // 初始化服务
        const service = new EmbeddingsVectorService(testDbPath, 'test-workspace');
        const seed = 1;

        // 测试数据
        const testContent: EmbeddingsContent = {
            id: '',
            sha256: '1234567890123456789012345678901234567890123456789012345678901234',
            model: 'test-model',
            vector: Array(1536).fill(0).map((_, i) => (i * seed % 100) / 100.0), // 生成测试向量
            status: 1,
            time: Date.now(),
            content: '测试内容'
        };
        
        // await service.dropTable(testContent.model);
        console.log('Testing dropTable...');

        // 测试保存
        console.log('Testing saveEmbeddings...');
        const saveResult = await service.saveEmbeddings([testContent]);
        console.log(`Save result: ${saveResult}`);
        
        const saveResult2 = await service.saveEmbeddings([testContent]);
        console.log(`Save result2: ${saveResult2}`);

        // 测试存在
        console.log('Testing existsEmbeddingsContent...');
        const exists = await service.existsEmbeddingsContent([testContent.sha256], testContent.model);
        console.log(`Exists: ${exists}`);

        // 测试查询
        console.log('Testing queryEmbeddings...');
        const vector = Array(1536).fill(0).map((_, i) => (i * 3.14 % 100) / 156.0);
        const queryResult = await service.queryEmbeddings('test-model', vector, 10);
        console.log(`Query result: ${JSON.stringify(queryResult)}`);

        // 测试更新状态
        console.log('Testing updateEmbeddingsStatus...');
        const updateResult = await service.updateEmbeddingsStatus(testContent.model, testContent.sha256, 0);
        console.log(`Update result: ${updateResult}`);
        
        // 再次查询验证状态更新
        console.log('Testing queryEmbeddings after status update...');
        const queryResult2 = await service.queryEmbeddings('test-model', vector, 10);
        console.log(`Query result after update: ${JSON.stringify(queryResult2)}`);

        console.log('All tests completed!');
        return true;
    } catch (error) {
        console.error(`Test failed: ${error}`);
        return false;
    }
}


