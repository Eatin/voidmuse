#!/usr/bin/env node

/**
 * 直接设置IntelliJ插件MCP配置的工具
 * 由于无法通过JavaScript控制台，我们直接修改配置文件
 */

const fs = require('fs');
const path = require('path');

// IntelliJ配置路径
const configPath = '/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml';

// MCP配置数据
const mcpConfig = {
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/eatin-li/Desktop", "/Users/eatin-li/IdeaProjects/voidmuse1"],
      "enabled": true
    }
  }
};

function updatePluginConfig() {
  try {
    // 读取现有配置
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // 查找或创建VoidMuse配置部分
    const voidMuseKey = 'VoidMuseDataState:global:mcps';
    const voidMuseValue = JSON.stringify(mcpConfig).replace(/"/g, '&quot;');
    
    // 检查是否已经存在该配置
    if (configContent.includes(voidMuseKey)) {
      // 更新现有配置
      const regex = new RegExp(`<entry key="${voidMuseKey}" value="[^"]*" />`);
      const newEntry = `<entry key="${voidMuseKey}" value="${voidMuseValue}" />`;
      configContent = configContent.replace(regex, newEntry);
      console.log('✅ 已更新现有MCP配置');
    } else {
      // 添加新配置到map部分
      const mapRegex = /(<map>)([\s\S]*?)(<\/map>)/;
      const newEntry = `    <entry key="${voidMuseKey}" value="${voidMuseValue}" />\n    `;
      
      if (configContent.match(mapRegex)) {
        configContent = configContent.replace(mapRegex, `$1\n    ${newEntry}$2$3`);
        console.log('✅ 已添加新MCP配置');
      } else {
        console.log('❌ 无法找到配置map部分');
        return false;
      }
    }
    
    // 备份原文件
    fs.writeFileSync(configPath + '.backup', fs.readFileSync(configPath, 'utf8'));
    
    // 写入更新后的配置
    fs.writeFileSync(configPath, configContent, 'utf8');
    
    console.log('✅ MCP配置已成功更新！');
    console.log('📁 配置文件：' + configPath);
    console.log('💾 备份文件：' + configPath + '.backup');
    console.log('🔄 请重启IntelliJ IDEA以使配置生效');
    
    return true;
    
  } catch (error) {
    console.error('❌ 更新配置失败：', error.message);
    return false;
  }
}

// 执行更新
console.log('🚀 开始设置MCP配置...');
console.log('📋 配置内容：', JSON.stringify(mcpConfig, null, 2));

if (updatePluginConfig()) {
  console.log('\n✨ 下一步操作：');
  console.log('1. 关闭IntelliJ IDEA');
  console.log('2. 重新启动IntelliJ IDEA');
  console.log('3. 查看日志确认MCP客户端初始化成功');
  console.log('4. 执行：tail -f ~/Library/Logs/JetBrains/IdeaIC2023.1/idea.log | grep -i "mcp"');
}