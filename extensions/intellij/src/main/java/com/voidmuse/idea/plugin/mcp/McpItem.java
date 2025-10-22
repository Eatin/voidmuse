package com.voidmuse.idea.plugin.mcp;

import java.util.List;
import java.util.Map;

public class McpItem {
    private String key;
    private String name;
    private String url;
    private String command;
    private List<String> args;
    private Map<String,Object> headers;
    private Boolean connected;
    private Boolean enabled;
    private List<McpToolInfo> tools;

    // Getters and Setters
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public List<String> getArgs() { return args; }
    public void setArgs(List<String> args) { this.args = args; }

    public Boolean getConnected() { return connected; }
    public void setConnected(Boolean connected) { this.connected = connected; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public List<McpToolInfo> getTools() { return tools; }
    public void setTools(List<McpToolInfo> tools) { this.tools = tools; }

    public Map<String, Object> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, Object> headers) {
        this.headers = headers;
    }

    public static class McpToolInfo {
        private String name;
        private String description;

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}