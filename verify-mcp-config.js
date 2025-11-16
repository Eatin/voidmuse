#!/usr/bin/env node

/**
 * 验证MCP配置格式并测试解析
 */

const fs = require('fs');

// 读取配置文件
const configPath = '/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml';

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // 提取MCP配置
  const mcpMatch = configContent.match(/<entry key="VoidMuseDataState:global:mcps" value="([^"]*)" \/>/);
  
  if (!mcpMatch) {
    console.log('❌ 未找到MCP配置');
    process.exit(1);
  }
  
  const mcpConfigStr = mcpMatch[1].replace(/&quot;/g, '"');
  const mcpConfig = JSON.parse(mcpConfigStr);
  
  console.log('✅ MCP配置格式验证通过！');
  console.log('📋 配置内容：');
  console.log(JSON.stringify(mcpConfig, null, 2));
  
  // 验证配置结构
  if (!mcpConfig.mcpServers || !mcpConfig.mcpServers.filesystem) {
    console.log('❌ 配置结构不完整');
    process.exit(1);
  }
  
  const filesystem = mcpConfig.mcpServers.filesystem;
  
  if (!filesystem.enabled) {
    console.log('❌ filesystem服务器未启用');
    process.exit(1);
  }
  
  if (!filesystem.command || !filesystem.args) {
    console.log('❌ filesystem服务器配置不完整');
    process.exit(1);
  }
  
  console.log('\n✅ 配置验证完成！');
  console.log('🎯 filesystem服务器状态：已启用');
  console.log('🔄 下一步：重启IntelliJ IDEA');
  
} catch (error) {
  console.error('❌ 验证失败：', error.message);
  process.exit(1);
}