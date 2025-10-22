import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface McpItem {
    key: string;
    name: string;
    url?: string;
    command?: string;
    args?: string[];
    headers?: Record<string, string>;
    connected?: boolean;
    enabled?: boolean;
    tools?: {
        name: string;
        description: string | undefined; 
    }[];
}

export class McpClient {
    private client: Client;
    private tools: Tool[] = [];
    public mcpConfig: McpItem;

    constructor(mcpConfig: McpItem) {
        this.client = new Client({
                name: 'voidmuse-mcp-client',
                version: '1.0.0'
            });
        this.mcpConfig = mcpConfig;
    }

    public async init() {
        await this.connectToServer();
    }

    public async close() {
        await this.client.close();
    }

    public async getTools() {
        return this.tools;
    }

    public getConfig() {
        return this.mcpConfig;
    }

    public async callTool(name: string, params: Record<string, any>) {
        return await this.client.callTool({
            name,
            arguments: params,
        });
    }

    private async connectToServer() {
        //连接远程mcp服务
        if(this.mcpConfig.url){
            const baseUrl = new URL(this.mcpConfig.url);
            try {
                this.client = new Client({
                    name: 'streamable-http-client',
                    version: '1.0.0'
                });
                let transport = new StreamableHTTPClientTransport(
                    new URL(baseUrl)
                );
                if (this.mcpConfig.headers){
                    transport = new StreamableHTTPClientTransport(baseUrl,{
                    requestInit: { headers: this.mcpConfig.headers }
                    });
                }
                await this.client.connect(transport);
                console.log("Connected using Streamable HTTP transport");
            } catch (error) {
                // If that fails with a 4xx error, try the older SSE transport
                console.log("Streamable HTTP connection failed, falling back to SSE transport");
                this.client = new Client({
                    name: 'sse-client',
                    version: '1.0.0'
                });
                let sseTransport = new SSEClientTransport(baseUrl);
                if (this.mcpConfig.headers){
                    sseTransport = new SSEClientTransport(baseUrl,{
                    requestInit: { headers: this.mcpConfig.headers }
                    });
                }
        

                await this.client.connect(sseTransport);
                console.log("Connected using SSE transport");
            }
        }
        //连接本地mcp服务
        else if(this.mcpConfig.command){
            const stdioTransport = new StdioClientTransport({
                command: this.mcpConfig.command,
                args: this.mcpConfig.args,
                env: {}
            });
            this.client.connect(stdioTransport);
            console.log("Connected using stdio transport");
        }
        
        const toolsResult = this.client.listTools();

        const tools = (await toolsResult).tools;
        console.log(tools);
        this.tools = tools.map((tool) => {
            return {
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
            };
        });
        this.mcpConfig.connected = true;

        console.log(
            "Connected to server with tools:",
            this.tools.map(({ name }) => name)
        );
    }
}
