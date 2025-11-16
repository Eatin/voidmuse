#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📋 MCP日志查看器\n');

// 1. 主要的IntelliJ日志
const mainLogPath = "/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/idea.log";
console.log('=== 1. IntelliJ主日志中的MCP相关日志 ===');

if (fs.existsSync(mainLogPath)) {
  try {
    // 获取最近的MCP日志
    const mcpLogs = execSync(`grep -i "mcp\|npx\|filesystem" "${mainLogPath}" | tail -20`, { encoding: 'utf8' });
    
    if (mcpLogs.trim()) {
      console.log('最近的MCP日志:');
      mcpLogs.split('\n').forEach(line => {
        if (line.includes('ERROR') || line.includes('SEVERE') || line.includes('Failed')) {
          console.log(`❌ ${line}`);
        } else if (line.includes('INFO')) {
          console.log(`ℹ️  ${line}`);
        } else {
          console.log(`   ${line}`);
        }
      });
    } else {
      console.log('ℹ️  主日志中没有找到MCP相关记录');
    }
  } catch (error) {
    console.log('⚠️  读取主日志失败:', error.message);
  }
} else {
  console.log('❌ 找不到主日志文件:', mainLogPath);
}

// 2. 插件专用日志
console.log('\n=== 2. 插件索引诊断日志 ===');
const indexingLogs = [
  "/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/indexing-diagnostic/voidmuse1.f10e1711",
  "/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/indexing-diagnostic/voidmuse.7b638d20"
];

indexingLogs.forEach(logPath => {
  if (fs.existsSync(logPath)) {
    console.log(`\n📁 查看日志: ${logPath}`);
    try {
      const content = execSync(`tail -10 "${logPath}"`, { encoding: 'utf8' });
      console.log(content);
    } catch (error) {
      console.log('⚠️  读取失败:', error.message);
    }
  }
});

// 3. 实时日志监控功能
console.log('\n=== 3. 实时日志监控 ===');
console.log('要实时监控MCP日志，请运行以下命令：');
console.log('');
console.log('# 监控主日志中的MCP相关条目');
console.log('tail -f "/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/idea.log" | grep -i "mcp"');
console.log('');
console.log('# 监控所有错误和警告');
console.log('tail -f "/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/idea.log" | grep -i "error\|severe\|failed"');
console.log('');
console.log('# 监控VoidMuse插件相关日志');
console.log('tail -f "/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/idea.log" | grep -i "voidmuse"');

// 4. 历史日志分析
console.log('\n=== 4. 历史错误分析 ===');
try {
  if (fs.existsSync(mainLogPath)) {
    const errorPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?(MCP|mcp|filesystem).*?(ERROR|SEVERE|Failed|Exception)/g;
    const logContent = fs.readFileSync(mainLogPath, 'utf8');
    const errors = [...logContent.matchAll(errorPattern)];
    
    if (errors.length > 0) {
      console.log(`找到 ${errors.length} 个历史MCP错误:`);
      errors.slice(-5).forEach(match => {
        console.log(`🕐 ${match[1]} - ❌ ${match[0].substring(0, 100)}...`);
      });
    } else {
      console.log('ℹ️  历史日志中没有找到MCP错误');
    }
  }
} catch (error) {
  console.log('⚠️  历史分析失败:', error.message);
}

// 5. 配置检查
console.log('\n=== 5. 当前MCP配置状态 ===');
const pluginFile = "/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml";

if (fs.existsSync(pluginFile)) {
  try {
    const content = fs.readFileSync(pluginFile, 'utf8');
    const mcpMatch = content.match(/VoidMuseDataState:global:mcps[^]*?value=\"([^\"]+)\"/) || content.match(/VoidMuseDataState:global:mcps[^]*?value=&quot;([^&]+)&quot;/);
    
    if (mcpMatch) {
      console.log('✅ 找到MCP配置');
      
      // 检查command路径
      if (mcpMatch[1].includes('command')) {
        const commandMatch = mcpMatch[1].match(/command[^&]*&quot;([^&]+)&quot;/) || mcpMatch[1].match(/command&quot;:&quot;([^&]+)&quot;/);
        if (commandMatch) {
          console.log(`当前command: ${commandMatch[1]}`);
          if (commandMatch[1] === 'npx') {
            console.log('⚠️  command仍然是\"npx\"，建议更新为完整路径');
          } else {
            console.log('✅ command已设置为完整路径');
          }
        }
      }
      
      // 检查连接状态
      if (mcpMatch[1].includes('\"connected\":true')) {
        console.log('✅ MCP显示为已连接状态');
      } else if (mcpMatch[1].includes('\"connected\":false')) {
        console.log('❌ MCP显示为未连接状态');
      }
      
    } else {
      console.log('❌ 未找到MCP配置');
    }
  } catch (error) {
    console.log('⚠️  读取配置文件失败:', error.message);
  }
} else {
  console.log('❌ 找不到插件配置文件');
}

console.log('\n📋 日志查看完成！');
console.log('\n💡 提示:');
console.log('- 红色 ❌ 表示错误或失败');
console.log('- 蓝色 ℹ️  表示信息或正常');
console.log('- 黄色 ⚠️  表示警告或需要注意');
console.log('- 绿色 ✅ 表示成功或正常');