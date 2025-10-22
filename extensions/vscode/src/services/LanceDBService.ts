import * as lancedb from '@lancedb/lancedb';
import { createLogger } from './logger';
const arrow = require("apache-arrow");
const logger = createLogger('LanceDBService');



export class LanceDbService {
    private dbConn!: lancedb.Connection;
    private table!: lancedb.Table;
    private fileTable!: lancedb.Table;
    private dbPath: string;
    private tableName = 'code_embeddings_index';
    private fileTableName = 'file_index';
    private fileBuffer:any[] = [];
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
        // 启动初始化但不在构造函数中等待
        this.initPromise = this.initializeLanceDB();
        this.initPromise.then(() => {
            this.isInitialized = true;
            // 初始化完成后再启动定时器
            setInterval(this.flushFileBuffer.bind(this), 60 * 1000);
        }).catch(err => {
            logger.error(`LanceDB initialization failed: ${err}`);
        });
    }

     // 确保初始化完成的辅助方法
    private async ensureInitialized() {
        if (!this.isInitialized && this.initPromise) {
            await this.initPromise;
        }
    }

    // 定时任务改为独立方法
    private async flushFileBuffer() {
        if (this.fileBuffer.length > 0) {
            await this.ensureInitialized();
            //await this.fileTable.add(this.fileBuffer);
            this.fileBuffer = [];
        }
    }

    async dropTable(){
        this.dbConn.dropTable(this.tableName);
        this.dbConn.dropTable(this.fileTableName);
    }

    async initializeLanceDB() {
        const dbPath = this.dbPath;
        logger.info(`LanceDB path: ${dbPath}`);
        // 连接到本地 LanceDB
        this.dbConn = await lancedb.connect(dbPath);
        logger.info(`Connected to LanceDB, db: ${this.dbConn}`);

        // 检查表是否存在
        const tables = await this.dbConn.tableNames();
        if (tables.includes(this.tableName)) {
            // 获取已存在的表
            this.table = await this.dbConn.openTable(this.tableName);
        }


        if (!tables.includes(this.fileTableName)) {

            const fileSchema = new arrow.Schema([
                new arrow.Field("filepath", new arrow.Utf8()),
                new arrow.Field("timestamp", new arrow.Int64()),
            ]);
            this.fileTable = await this.dbConn.createEmptyTable(this.fileTableName, fileSchema, { mode: "overwrite" },);
            this.fileTable.createIndex("filepath", { 
                config: lancedb.Index.bitmap() 
            });
        } else {
            // 获取已存在的表
            this.fileTable = await this.dbConn.openTable(this.fileTableName);
        }
    
    }

    async addDatas(records: any[]){
        if(!this.table){
            const tables = await this.dbConn.tableNames();
            if (!tables.includes(this.tableName)) {
                this.table = await this.dbConn.createTable(this.tableName, records, { mode: "overwrite" },);
                this.table.createIndex("content", {
                    config: lancedb.Index.fts(),
                });
                
                this.table.createIndex("filepath", { 
                    config: lancedb.Index.bitmap() 
                });
                return;

            } else {
                // 获取已存在的表
                this.table = await this.dbConn.openTable(this.tableName);
            }
        }
        

        try{
            if(records){
                if(records.length>0){
                    await this.table.add(records);
                }
            }
        } catch (error) {
            logger.error(`add error data:${records} error: ${error}`);
            return null;
        }
    }

    async addFile(file: any){
        try{
            if(file){
                await this.fileTable.add([file]);
            }
        } catch (error) {
            logger.error(`add error data:${file} error: ${error}`);
            return null;
        }
        
    }

    async haveFileIndex(filePath:string){
        await this.ensureInitialized();
        return this.fileTable
            .query().where(`filepath = '${filePath}'`)
            .limit(1)
            .toArray();
    }

    async addContentIndex(){
        await this.table.createIndex("content", {
                config: lancedb.Index.fts(),
            });
        await  this.fileTable.createIndex("filepath", { 
                config: lancedb.Index.bitmap() 
            });
    }

    async query(vector: number[], query: string, maxSearchResult:number){
        const results = await this.table.query()
                .nearestToText(query)
                .nearestTo(vector)
                .limit(maxSearchResult)
                .toArray();
        return results;
    }

    async queryAll(){
        return this.fileTable.query().limit(10000).toArray();
    }

    async queryByFilePath(filePath:string){
        return this.fileTable.query().where(`filepath = '${filePath}'`)
                    .toArray();
    }

    async deleteByFilePath(filePath:string){
        this.fileTable.delete(`filepath = '${filePath}'`);
        this.table.delete(`filepath = '${filePath}'`);
    }

    
}