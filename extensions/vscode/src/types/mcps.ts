/**
 * mcp管理相关类型定义
 */

export interface McpItem {
    key: string;
    name: string;
    url: string;
    config: string;
    command: string;
    args: string[];
    connected: boolean;
    enabled?: boolean;
    // 新增：支持Agentic工具标识符
    agenticTools?: string[]; // 如 ['@agentic/search', '@agentic/context7']
    tools: {
        name: string;
        description: string | undefined; 
    }[];
}
