package com.voidmuse.idea.plugin.mcp;

import cn.hutool.json.JSONUtil;
import com.intellij.openapi.components.Service;
import com.voidmuse.idea.plugin.common.PluginDataPersistent;
import io.modelcontextprotocol.spec.McpSchema;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

//@Service(Service.Level.PROJECT)
public final class McpService {
    private static final Logger LOGGER = Logger.getLogger(McpService.class.getName());
    private static McpService instance;
    private final Map<String, MCPClient> clients = new ConcurrentHashMap<>();

    private McpService() {
        PluginDataPersistent dataPersistent = PluginDataPersistent.getInstance();
        String jsonConfig = dataPersistent.getState().getData("global:mcps");
        try {
            LOGGER.info(jsonConfig);
            loadConfig(jsonConfig);
        } catch (Exception e) {
            LOGGER.info("load mcp config error:"+e.getMessage());
        }
    }

    public static synchronized McpService getInstance() {
        if (instance == null) {
            instance = new McpService();
        }
        return instance;
    }

    public void loadConfig(String jsonConfig) throws Exception {
        try {

            LOGGER.info("Loading MCP config: " + jsonConfig);
            // 使用 JSON 解析库如 Jackson 或 Gson
            List<McpItem> configItems = parseJsonConfig(jsonConfig);
            updateClients(configItems);
        } catch (Exception e) {
            LOGGER.severe("Error loading MCP config: " + e.getMessage());
            throw new Exception("Failed to load MCP configuration", e);
        }
    }

    private void updateClients(List<McpItem> items) throws Exception {
        Set<String> currentKeys = new HashSet<>(clients.keySet());
        Set<String> targetKeys = new HashSet<>();

        // 更新或创建新客户端
        for (McpItem item : items) {
            if (item.getEnabled() == null || !item.getEnabled()) continue;

            targetKeys.add(item.getName());
            try {
                if (clients.containsKey(item.getName())) {
                    MCPClient client = clients.get(item.getName());
                    if (client.getConfig().getConnected() == null || !client.getConfig().getConnected()) {
                        client.init();
                    }
                } else {
                    MCPClient client = new MCPClient(item);
                    clients.put(item.getName(), client);
                    client.init();
                }
            } catch (Exception e) {
                LOGGER.severe("Init client error for " + item.getName() + ": " + e.getMessage());
            }
        }

        // 移除禁用的客户端
        for (String key : currentKeys) {
            if (!targetKeys.contains(key)) {
                MCPClient client = clients.get(key);
                if (client != null) {
                    client.close();
                }
                clients.remove(key);
            }
        }
    }

    public MCPClient getClient(String key) {
        return clients.get(key);
    }

    public List<MCPClient> getAllClients() {
        return new ArrayList<>(clients.values());
    }

    public void reloadConfig(String jsonConfig) throws Exception {
        loadConfig(jsonConfig);
    }

    public void shutdown() {
        for (MCPClient client : clients.values()) {
            client.close();
        }
        clients.clear();
        instance = null;
    }

    public Map<String, McpSchema.Tool> getMcpTools() throws Exception {
        Map<String, McpSchema.Tool> allTools = new HashMap<>();
        for (Map.Entry<String, MCPClient> entry : clients.entrySet()) {
            List<McpSchema.Tool> tools = entry.getValue().getTools();
            for (McpSchema.Tool tool : tools) {
                String name = entry.getValue().getConfig().getName() + "_" + tool.name();
                allTools.put(name, tool);
            }
        }
        return allTools;
    }

    public Object callMcpTool(String serviceName, String toolName, Map<String, Object> params) throws Exception {
        MCPClient client = clients.get(serviceName);
        if (client == null) {
            String errorMsg = "MCP service not found: " + serviceName;
            LOGGER.severe(errorMsg);
            throw new Exception(errorMsg);
        }

        try {
            return client.callTool(toolName, params);
        } catch (Exception e) {
            String errorMsg = "Call MCP tool failed: " + serviceName + "." + toolName + " - " + e.getMessage();
            LOGGER.severe(errorMsg);
            throw new Exception(errorMsg, e);
        }
    }

    public McpConnectionTestResult testMcpConnection(String name) {
        MCPClient client = clients.get(name);
        if (client != null) {
            try {
                List<McpSchema.Tool> tools = client.getTools();
                if (tools.isEmpty()) {
                    client.init();
                    tools = client.getTools();
                }

                List<McpItem.McpToolInfo> toolInfos = new ArrayList<>();
                for (McpSchema.Tool tool : tools) {
                    McpItem.McpToolInfo toolInfo = new McpItem.McpToolInfo();
                    toolInfo.setName(tool.name());
                    toolInfo.setDescription(tool.description());
                    toolInfos.add(toolInfo);
                }

                return new McpConnectionTestResult(true, tools.size(), toolInfos, null);
            } catch (Exception e) {
                return new McpConnectionTestResult(false, 0, null, e.getMessage());
            }
        }
        return new McpConnectionTestResult(false, 0, null, "Client not found");
    }


    private List<McpItem> parseJsonConfig(String json) {
        return JSONUtil.toList(json,McpItem.class);
    }

    public static class McpConnectionTestResult {
        private boolean success;
        private int toolCount;
        private List<McpItem.McpToolInfo> tools;
        private String error;

        public McpConnectionTestResult(boolean success, int toolCount,
                                       List<McpItem.McpToolInfo> tools,
                                       String error) {
            this.success = success;
            this.toolCount = toolCount;
            this.tools = tools;
            this.error = error;
        }

        // Getters
        public boolean isSuccess() { return success; }
        public int getToolCount() { return toolCount; }
        public List<McpItem.McpToolInfo> getTools() { return tools; }
        public String getError() { return error; }
    }
}