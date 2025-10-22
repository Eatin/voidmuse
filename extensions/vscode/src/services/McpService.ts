import { PluginConfig } from '../PluginConfig';
import { Constants } from '../common/Constants';
import { McpClient, McpItem } from './McpClient'; // 调整路径为实际位置

export interface CallMcpParams {
    serviceName: string;
    toolName: string;
    params: Record<string, any>; 
  }

 /**
 * MCP 连接测试结果
 */
export interface McpConnectionTestResult {
    success: boolean;
    toolCount?: number;
    error?: string;
    tools?: {
        name: string;
        description: string | undefined; 
    }[];
}

class McpService {

    private static instance: McpService;
    private clients: Map<string, McpClient> = new Map();

    private constructor() {
    }

    public static async getInstance(): Promise<McpService> {
        if (!McpService.instance) {
            McpService.instance = new McpService();
            var config = PluginConfig.get(Constants.SETTING_MCP_CONFIG, '[]');
            await McpService.instance.loadConfig(config);
        }
        return McpService.instance;
    }

    private async loadConfig(data:string): Promise<void> {
        try {
            console.info("load mcp config:"+data);
            const configItems: McpItem[] = JSON.parse(data);
            await this.updateClients(configItems);
        } catch (error) {
            console.error('Error loading MCP config:', error);
            throw new Error('Failed to load MCP configuration');
        }
    }

    private async updateClients(items: McpItem[]): Promise<void> {
        const currentKeys = new Set(this.clients.keys());
        const targetKeys = new Set<string>();

        // 更新或创建新客户端
        for (const item of items) {
            if (!item.enabled){
                continue;
            } 

            targetKeys.add(item.name);
            try{
                if (this.clients.has(item.name)) {
                    // 更新现有客户端配置
                    const client = this.clients.get(item.name)!;
                    if (!client.mcpConfig.connected) {
                        await client.init();
                    }
                } else {
                    // 创建新客户端
                    const client = new McpClient(item);
                    this.clients.set(item.name, client);
                    await client.init();
                    
                }
            }catch(error){
                console.error("init client error"+item+error);
                continue;
            }
            
        }

        // 移除禁用的客户端
        for (const key of currentKeys) {
            if (!targetKeys.has(key)) {
                const client = this.clients.get(key)!;
                await client.close();
                this.clients.delete(key);
            }
        }
    }

    public getClient(key: string): McpClient | undefined {
        return this.clients.get(key);
    }

    public getAllClients(): McpClient[] {
        return Array.from(this.clients.values());
    }

    public async reloadConfig(data:string): Promise<void> {
        await this.loadConfig(data);
    }

    public async shutdown(): Promise<void> {
        for (const client of this.clients.values()) {
            await client.close();
        }
        this.clients.clear();
        McpService.instance = null as any; // 重置单例
    }

    async getMcpTools(): Promise<Record<string, any> | undefined> {

        const allTools: Record<string, any> = {};
        for (const [key, value] of this.clients.entries()) {
            const tools = await value.getTools();
            for (const t of tools) {
                const name = `${value.mcpConfig.name}_${t.name}`;
                allTools[name] = t;
            }
        }
        return allTools;
    }

    async callMcpTool(params:CallMcpParams){
        const { serviceName, toolName, params: toolParams } = params;
    
        // 1. 查找对应的客户端实例
        const client = this.clients.get(serviceName);
        
        // 2. 客户端不存在时的处理
        if (!client) {
            const errorMsg = `MCP service not found: ${serviceName}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        try {
            // 3. 调用工具并返回结果
            const result = await client.callTool(toolName, toolParams);
            return result;
        } catch (error) {
            // 4. 错误处理和日志记录
            const errorMsg = `Call MCP tool failed: ${serviceName}.${toolName} - ${error instanceof Error ? error.message : error}`;
            console.error(errorMsg, error);
            throw new Error(errorMsg);
        }
    }

    async testMcpConnection(name: any):Promise<McpConnectionTestResult> {
        const client = this.clients.get(name);
        if (client){
            const toolCount = client.getTools.length;
            if(toolCount === 0){
                await client.init();
            }
            return {
                success: true,
                toolCount,
                tools:(await client.getTools()).map(tool => {
                    return {
                        name: tool.name,
                        description: tool.description,
                    };
                })
            };          
        }
        return {
            success: false,
            error: 'connect fail'
        };
    
        
    }
}

export default McpService.getInstance();