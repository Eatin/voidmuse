#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始完整修复MCP连接问题...\n');

// 1. 检查Node.js和npx环境
console.log('=== Node.js环境检查 ===');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const npxVersion = execSync('npx --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js版本: ${nodeVersion}`);
  console.log(`✅ npx版本: ${npxVersion}`);
} catch (error) {
  console.error('❌ Node.js或npx未找到:', error.message);
  process.exit(1);
}

// 2. 获取npx完整路径
let npxPath;
try {
  npxPath = execSync('which npx', { encoding: 'utf8' }).trim();
  console.log(`✅ npx完整路径: ${npxPath}`);
} catch (error) {
  console.error('❌ 无法找到npx路径:', error.message);
  process.exit(1);
}

// 3. 检查IntelliJ配置目录
const intellijConfigDir = '/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options';
const pluginFile = path.join(intellijConfigDir, 'plugin.xml');

if (!fs.existsSync(pluginFile)) {
  console.error('❌ 找不到IntelliJ插件配置文件:', pluginFile);
  process.exit(1);
}

// 4. 创建备份
const backupFile = `${pluginFile}.backup.${Date.now()}`;
fs.copyFileSync(pluginFile, backupFile);
console.log(`✅ 已创建备份文件: ${backupFile}`);

// 5. 读取当前配置
let pluginContent = fs.readFileSync(pluginFile, 'utf8');

// 6. 查找并替换MCP配置
const mcpConfigRegex = /(&lt;entry key=&quot;VoidMuseDataState:global:mcps&quot; value=&quot;)([^&]*filesystem[^&]*)(&quot; \/>)/;

if (!mcpConfigRegex.test(pluginContent)) {
  console.error('❌ 找不到MCP配置项');
  process.exit(1);
}

// 7. 构建新的MCP配置
const newMcpConfig = `[{&quot;key&quot;:&quot;1763141421032&quot;,&quot;name&quot;:&quot;filesystem&quot;,&quot;url&quot;:&quot;&quot;,&quot;command&quot;:&quot;${npxPath}&quot;,&quot;args&quot;:[&quot;-y&quot;,&quot;@modelcontextprotocol/server-filesystem&quot;,&quot;/Users/eatin-li/Desktop&quot;,&quot;/Users/eatin-li/IdeaProjects/voidmuse1&quot;],&quot;headers&quot;:{},&quot;config&quot;:&quot;{\\n  \\\&quot;mcpServers\\\&quot;: {\\n    \\\&quot;filesystem\\\&quot;: {\\n      \\\&quot;args\\\&quot;: [\\n        \\\&quot;-y\\\&quot;,\\n        \\\&quot;@modelcontextprotocol/server-filesystem\\\&quot;,\\n        \\\&quot;/Users/eatin-li/Desktop\\\&quot;,\\n        \\\&quot;/Users/eatin-li/IdeaProjects/voidmuse1\\\&quot;\\n      ],\\n      \\\&quot;command\\\&quot;: \\\&quot;${npxPath}\\\&quot;\\n    }\\n  }\\n}&quot;,&quot;connected&quot;:false,&quot;enabled&quot;:true,&quot;mcpId&quot;:&quot;filesystem&quot;}]`;

// 8. 替换配置
pluginContent = pluginContent.replace(mcpConfigRegex, `$1${newMcpConfig}$3`);

// 9. 写入新配置
fs.writeFileSync(pluginFile, pluginContent, 'utf8');

console.log('✅ MCP配置已完全更新！');
console.log('📋 更新内容:');
console.log(`  - command: ${npxPath}`);
console.log('  - args: 包含Desktop和voidmuse1目录');
console.log('  - config中的command也已更新为完整路径');

console.log('\n🎉 完整修复完成！');
console.log('\n下一步操作:');
console.log('1. 重启IntelliJ IDEA');
console.log('2. 打开MCP配置界面');
console.log('3. 测试filesystem连接');
console.log('4. 如果仍有问题，请查看idea.log日志');