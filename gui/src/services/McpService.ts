import { McpItem } from '@/types/mcps';
import { IDEService } from '@/api/IDEService'
import { convertJsonToTool } from './tool/McpToolUtil';
import { McpConnectionTestResult } from '../types/ide';

// MCP SDK imports - only available in Node.js environment
let Client: any;
let StdioClientTransport: any;

if (typeof window === 'undefined') {
  // Node.js environment
  try {
    const mcpClient = require('@modelcontextprotocol/sdk/client/index.js');
    const mcpStdio = require('@modelcontextprotocol/sdk/client/stdio.js');
    Client = mcpClient.Client;
    StdioClientTransport = mcpStdio.StdioClientTransport;
  } catch (error) {
    console.warn('MCP SDK not available in this environment');
  }
}


interface McpToolsResult {
    tools: Record<string, any>;
    serverName: string;
    toolCount: number;
}

export class McpService {

    private static addMcpFunction: ((mcp: McpItem) => Promise<void>) | null = null;
    private static initialized = false;

    static setAddMcp(addMcp: (mcp: McpItem) => Promise<void>) {
        this.addMcpFunction = addMcp;
        this.initialized = true;
        console.log('addMcp method has been successfully set');
    }

    static async addMcp(mcp: McpItem): Promise<void> {
        if (!this.initialized || !this.addMcpFunction) {
            console.error('addMcp method not initialized, please ensure it is set at application startup');
            throw new Error('addMcp method not initialized, please ensure it is set at application startup');
        }
        return this.addMcpFunction(mcp);
    }

    static isInitialized() {
        return this.initialized;
    }

    static createTransportConfig(mcpConfig: McpItem) {
        if (mcpConfig.url) {
            // Remote MCP server (SSE)
            return {
                type: 'sse' as const,
                url: mcpConfig.url
            };
        } else if (mcpConfig.command) {
            // Local MCP server (stdio) - only available in Node.js environment
            if (!StdioClientTransport) {
                console.warn('StdioClientTransport not available in browser environment');
                return null;
            }
            return new StdioClientTransport({
                command: mcpConfig.command,
                args: mcpConfig.args || []
            });
        }

        return null;
    }

    static async testConnection(mcpConfig: McpItem): Promise<McpConnectionTestResult> {
        try {
            const ideService = IDEService.getInstance()
            return await ideService.testMcpConnection(mcpConfig.name);
        } catch (error) {
            console.error(`Failed to connect to MCP server ${mcpConfig.name}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get the tool list from MCP server
     * @param mcpConfig MCP configuration item
     * @param addPrefix Whether to add server name prefix to tool names
     * @returns Tool retrieval result
     */
    static async getTools(mcpConfig: McpItem, addPrefix: boolean = true): Promise<McpToolsResult | null> {
        // 浏览器环境下直接返回空结果，避免MCP SDK错误
        if (typeof window !== 'undefined') {
            console.log('MCP tools loading skipped in browser environment');
            return {
                tools: {},
                serverName: mcpConfig.name,
                toolCount: 0
            };
        }

        try {
            const transport = this.createTransportConfig(mcpConfig);
            if (!transport) {
                console.warn(`MCP config ${mcpConfig.name} has no URL or command specified`);
                return null;
            }

            if (!Client) {
                console.warn('MCP Client not available in this environment');
                return null;
            }

            // Create MCP client
            const client = new Client({ name: mcpConfig.name, version: '1.0.0' });
            await client.connect(transport);

            try {
                // Get MCP tools (AI SDK will automatically convert to tool format)
                const toolsResult = await client.listTools();
                const mcpTools = toolsResult.tools;

                let tools: Record<string, any> = {};

                if (addPrefix) {
                    // Add tools to the tool collection, using server name as prefix
                    Object.entries(mcpTools).forEach(([toolName, tool]) => {
                        const prefixedToolName = `${mcpConfig.name}_${toolName}`;
                        tools[prefixedToolName] = tool;
                    });
                } else {
                    tools = mcpTools;
                }

                console.log(`Loaded ${Object.keys(mcpTools).length} tools from MCP server: ${mcpConfig.name}`);

                return {
                    tools,
                    serverName: mcpConfig.name,
                    toolCount: Object.keys(mcpTools).length
                };
            } finally {
                await client.close();
            }
        } catch (error) {
            console.error(`Failed to load MCP tools from ${mcpConfig.name}:`, error);
            return null;
        }
    }

    static async callTool(toolName: string, toolArgs: any): Promise<any> {
        // This method is intentionally left empty as the actual tool calling
        // is handled by the IDE service or the MCP client directly.
        throw new Error('callTool is not implemented in McpService');
    }

    
    static async getToolsFromConfigs(mcpConfigs: McpItem[], addPrefix: boolean = true): Promise<Record<string, any>> {
        const allTools: Record<string, any> = {};

        // Only process enabled and connected MCP configurations
        const enabledMcps = mcpConfigs.filter(mcp => mcp.enabled && mcp.connected);

        for (const mcpConfig of enabledMcps) {
            const result = await this.getTools(mcpConfig, addPrefix);
            if (result) {
                Object.assign(allTools, result.tools);
            }
        }

        return allTools;
    }

    static async getToolsFromIde(): Promise<Record<string, any>> {
        const ideService = IDEService.getInstance()
        const tools = await ideService.getMcpTools();
        console.log(tools);

        return convertJsonToTool(tools);
    }

    
    static async testMultipleConnections(mcpConfigs: McpItem[]): Promise<Map<string, McpConnectionTestResult>> {
        const results = new Map<string, McpConnectionTestResult>();

        // Test all connections in parallel
        const testPromises = mcpConfigs.map(async (config) => {
            const result = await this.testConnection(config);
            results.set(config.key, result);
        });

        await Promise.all(testPromises);

        return results;
    }


    
    static validateConfig(mcpConfig: McpItem): boolean {
        if (!mcpConfig.name || !mcpConfig.key) {
            return false;
        }

        // Must have either URL or command
        return !!(mcpConfig.url || mcpConfig.command);
    }
}

export default McpService;