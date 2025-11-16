# IntelliJ插件MCP连接测试指南

## 概述
本指南帮助你在IntelliJ IDEA插件中测试MCP（Model Context Protocol）连接，并解决连接失败问题。

## 前提条件
- 已安装IntelliJ IDEA
- 已构建插件（`VoidMuse-0.0.1-221.1.zip`）
- 已安装Node.js（用于MCP服务器）

## 步骤1：安装插件

1. 打开IntelliJ IDEA
2. 进入 `Settings/Preferences` → `Plugins`
3. 点击齿轮图标 → `Install Plugin from Disk...`
4. 选择 `/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/build/distributions/VoidMuse-0.0.1-221.1.zip`
5. 重启IDEA

## 步骤2：配置MCP服务器

### 方法A：使用JavaScript控制台配置
1. 在IDEA中打开 `JavaScript Console`（帮助 → 诊断工具 → JavaScript控制台）
2. 粘贴并执行以下配置代码：

```javascript
window.callJava({
    "method": "setPersistentState",
    "args": [{
        "mcpServers": {
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/eatin-li/Desktop", "/Users/eatin-li/IdeaProjects/voidmuse1"],
                "type": "stdio"
            }
        }
    }]
});
```

### 方法B：使用配置文件
1. 创建或编辑 `~/Library/Application Support/JetBrains/IntelliJIdea2023.1/options/voidmuse.xml`
2. 添加MCP配置：

```xml
<application>
  <component name="VoidMuseSettings">
    <option name="mcpServers">
      <map>
        <entry key="filesystem">
          <value>
            <McpItem>
              <option name="name" value="filesystem" />
              <option name="command" value="npx" />
              <option name="args">
                <list>
                  <option value="-y" />
                  <option value="@modelcontextprotocol/server-filesystem" />
                  <option value="/Users/eatin-li/Desktop" />
                  <option value="/Users/eatin-li/IdeaProjects/voidmuse1" />
                </list>
              </option>
              <option name="type" value="stdio" />
              <option name="enabled" value="true" />
            </McpItem>
          </value>
        </entry>
      </map>
    </option>
  </component>
</application>
```

## 步骤3：查看MCP连接日志

### 启用调试日志
1. 在IDEA中打开 `Help` → `Diagnostic Tools` → `Debug Log Settings`
2. 添加以下日志类别：
   - `com.voidmuse.idea.plugin.mcp.MCPClient`
   - `com.voidmuse.idea.plugin.mcp.McpService`

### 查看日志文件
日志文件位置：`~/Library/Logs/JetBrains/IntelliJIdea2023.1/idea.log`

### 预期日志输出
成功连接时，你应该看到类似以下日志：

```
INFO: Starting MCP client initialization for: filesystem
INFO: MCP config - Name: filesystem, Command: npx, Args: [-y, @modelcontextprotocol/server-filesystem, /Users/eatin-li/Desktop, /Users/eatin-li/IdeaProjects/voidmuse1]
INFO: Creating stdio transport for: filesystem
INFO: MCP client initialized successfully for: filesystem
INFO: Testing MCP connection for: filesystem
INFO: Found client for: filesystem, connected: true
INFO: MCP tools list response: [list of available tools]
INFO: MCP connection test successful for filesystem. Found X tools: [tool names]
```

## 步骤4：测试MCP连接

### 使用插件界面测试
1. 打开插件工具窗口（通常在右侧或底部面板）
2. 找到MCP配置部分
3. 点击"测试连接"按钮
4. 查看测试结果

### 使用JavaScript控制台测试
在JavaScript控制台中执行：
```javascript
window.callJava({
    "method": "testMcpConnection",
    "args": ["filesystem"]
});
```

## 常见问题排查

### 问题1：MCP服务器启动失败
**症状**：日志显示"Failed to initialize client for filesystem"
**解决**：
1. 确保已安装Node.js：`node -v`
2. 测试MCP服务器独立运行：
   ```bash
   npx -y @modelcontextprotocol/server-filesystem /Users/eatin-li/Desktop
   ```
3. 检查文件路径权限

### 问题2：工具列表为空
**症状**：日志显示"MCP tools list is empty"
**解决**：
1. 检查MCP服务器是否正确启动
2. 验证服务器返回的工具列表
3. 检查客户端初始化状态

### 问题3：连接超时
**症状**：日志显示"MCP connection timeout"
**解决**：
1. 增加超时时间
2. 检查网络连接（如果使用远程MCP服务器）
3. 验证MCP服务器响应时间

## 验证MCP服务器

### 独立测试脚本
使用提供的测试脚本验证MCP服务器：
```bash
cd /Users/eatin-li/IdeaProjects/voidmuse1
export JAVA_HOME=/Users/eatin-li/Desktop/ideaplugin/jdks/graalvm-community-openjdk-17.0.8+7.1/Contents/Home
node test-mcp-connection.js
```

### 预期输出
```
Secure MCP Filesystem Server running on stdio
Received tools/list response: {
  "tools": [
    {
      "name": "read_file",
      "description": "Read a file from the filesystem",
      "inputSchema": {...}
    },
    // ... more tools
  ]
}
```

## 高级调试

### 启用详细日志
在`MCPClient.java`和`McpService.java`中已添加详细日志记录，包括：
- 客户端初始化过程
- 传输层详细信息
- 工具列表加载
- 连接测试步骤

### 日志分析技巧
1. 搜索"MCP"关键字过滤相关日志
2. 关注ERROR和WARNING级别日志
3. 检查异常堆栈跟踪
4. 验证配置参数是否正确加载

## 获取帮助

如果问题仍然存在：
1. 收集完整的IDEA日志文件
2. 记录MCP配置详情
3. 提供操作系统和IDEA版本信息
4. 检查GitHub Issues或寻求社区支持

## 相关文件
- 插件构建输出：`/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/build/distributions/VoidMuse-0.0.1-221.1.zip`
- 测试脚本：`/Users/eatin-li/IdeaProjects/voidmuse1/test-mcp-connection.js`
- MCP配置：`/Users/eatin-li/IdeaProjects/voidmuse1/mcp-config-filesystem.json`