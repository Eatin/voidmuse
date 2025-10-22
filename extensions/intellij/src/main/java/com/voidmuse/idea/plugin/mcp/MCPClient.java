package com.voidmuse.idea.plugin.mcp;

import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;
import io.modelcontextprotocol.client.transport.HttpClientStreamableHttpTransport;
import io.modelcontextprotocol.client.transport.ServerParameters;
import io.modelcontextprotocol.client.transport.StdioClientTransport;
import io.modelcontextprotocol.spec.McpClientTransport;
import io.modelcontextprotocol.spec.McpSchema;

import java.net.http.HttpRequest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.logging.Logger;

public class MCPClient {
    private static final Logger LOGGER = Logger.getLogger(MCPClient.class.getName());

    private McpSyncClient client;
    private List<McpSchema.Tool> tools = new ArrayList<>();
    private McpItem mcpConfig;

    public MCPClient(McpItem mcpConfig) {
        this.mcpConfig = mcpConfig;
    }

    public void init(){
        McpClientTransport transport;
        if (mcpConfig.getUrl() != null && !mcpConfig.getUrl().isEmpty()) {

            try {
                HttpClientSseClientTransport.Builder builder = HttpClientSseClientTransport.builder(mcpConfig.getUrl());
                if(mcpConfig.getHeaders() != null && !mcpConfig.getHeaders().isEmpty()){
                    Consumer<HttpRequest.Builder> customizer = reqBuilder -> {
                        mcpConfig.getHeaders().forEach((k,v)->{
                            reqBuilder.setHeader(k,v.toString());
                        });
                    };

                    builder.customizeRequest(customizer);
                }
                transport = builder.build();

                this.client = McpClient.sync(transport)
                        .requestTimeout(Duration.ofSeconds(10))
                        .capabilities(McpSchema.ClientCapabilities.builder()
                                .roots(true)      // Enable roots capability
                                .sampling()       // Enable sampling capability
                                .build())
                        .build();
                this.client.initialize();

                LOGGER.info("Connected using SSE transport");
            } catch (Exception e) {
                /*// 如果失败，回退到 SSE 传输
                LOGGER.warning("Streamable HTTP connection failed, falling back to SSE transport");
                HttpClientStreamableHttpTransport.Builder builder = HttpClientStreamableHttpTransport.builder(mcpConfig.getUrl());
                if(mcpConfig.getHeaders() != null && !mcpConfig.getHeaders().isEmpty()){
                    Consumer<HttpRequest.Builder> customizer = reqBuilder -> {
                        mcpConfig.getHeaders().forEach((k,v)->{
                            reqBuilder.setHeader(k,v.toString());
                        });
                    };

                    builder.customizeRequest(customizer);
                }
                transport = builder.build();

                this.client = McpClient.sync(transport)
                        .requestTimeout(Duration.ofSeconds(10))
                        .capabilities(McpSchema.ClientCapabilities.builder()
                                .roots(true)      // Enable roots capability
                                .sampling()       // Enable sampling capability
                                .build())
                        .build();
                this.client.initialize();
                LOGGER.info("Connected using Streamable HTTP transport");*/
            }
        } else{
            ServerParameters params = ServerParameters.builder(mcpConfig.getCommand())
                    .args(mcpConfig.getArgs())
                    .build();
            transport = new StdioClientTransport(params);
            this.client = McpClient.sync(transport)
                    .requestTimeout(Duration.ofSeconds(10))
                    .capabilities(McpSchema.ClientCapabilities.builder()
                            .roots(true)      // Enable roots capability
                            .sampling()       // Enable sampling capability
                            .build())
                    .build();
            LOGGER.info("Connected using SSE transport");
            this.client.initialize();
        }
        McpSchema.ListToolsResult tools = client.listTools();
        this.tools = tools.tools();
        mcpConfig.setConnected(true);
    }

    public void close() {
        if (client != null) {
            client.close();
        }
    }

    public List<McpSchema.Tool> getTools() {
        return tools;
    }

    public McpItem getConfig() {
        return mcpConfig;
    }

    public Object callTool(String name, Map<String, Object> params) throws Exception {
        McpSchema.CallToolRequest request = new McpSchema.CallToolRequest(name,params);
        return client.callTool(request);
    }

}