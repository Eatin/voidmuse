export interface McpItem {
    key: string;
    name: string;
    url: string;
    config: string;
    command: string;
    args: string[];
    headers?: Record<string, string>;
    connected: boolean;
    enabled?: boolean;
    tools: {
        name: string;
        description: string | undefined; 
    }[] | undefined;
}
