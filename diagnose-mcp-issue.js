#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 MCP连接问题诊断工具\n');

// 1. 检查Node.js环境
console.log('=== 1. Node.js环境检查 ===');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const npxVersion = execSync('npx --version', { encoding: 'utf8' }).trim();
  const npxPath = execSync('which npx', { encoding: 'utf8' }).trim();
  
  console.log(`✅ Node.js版本: ${nodeVersion}`);
  console.log(`✅ npx版本: ${npxVersion}`);
  console.log(`✅ npx路径: ${npxPath}`);
} catch (error) {
  console.error('❌ Node.js环境检查失败:', error.message);
}

// 2. 检查MCP服务器
console.log('\n=== 2. MCP服务器测试 ===');
try {
  console.log('正在测试MCP filesystem服务器...');
  
  const testResult = execSync(`echo '{"jsonrpc":"2.0","method":"mcp.listTools","id":1}' | npx -y @modelcontextprotocol/server-filesystem /Users/eatin-li/Desktop /Users/eatin-li/IdeaProjects/voidmuse1`, {
    encoding: 'utf8',
    timeout: 10000,
    shell: true
  }).trim();
  
  if (testResult.includes('mcp.list_tools')) {
    console.log('✅ MCP filesystem服务器运行正常');
  } else {
    console.log('⚠️  MCP服务器响应异常:', testResult.substring(0, 200));
  }
} catch (error) {
  console.error('❌ MCP服务器测试失败:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout.toString().substring(0, 200));
  if (error.stderr) console.log('stderr:', error.stderr.toString().substring(0, 200));
}

// 3. 检查IntelliJ配置
console.log('\n=== 3. IntelliJ配置检查 ===');
const pluginFile = '/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml';

if (fs.existsSync(pluginFile)) {
  try {
    const content = fs.readFileSync(pluginFile, 'utf8');
    
    // 检查command路径
    const commandMatch = content.match(/&quot;command&quot;:&quot;([^&]*)&quot;/);
    if (commandMatch) {
      const commandPath = commandMatch[1];
      console.log(`当前command路径: ${commandPath}`);
      
      if (commandPath === 'npx') {
        console.log('❌ command仍然是\"npx\"，需要更新为完整路径');
      } else if (commandPath.includes('/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/npx')) {
        console.log('✅ command路径已更新为完整路径');
      } else {
        console.log(`⚠️  command路径为: ${commandPath}`);
      }
    }
    
    // 检查config中的command
    const configMatch = content.match(/&quot;command&quot;:\\&quot;([^\\]*)&quot;/);
    if (configMatch) {
      const configCommand = configMatch[1];
      console.log(`config中command路径: ${configCommand}`);
      
      if (configCommand === 'npx') {
        console.log('❌ config中的command仍然是\"npx\"，需要更新');
      } else if (configCommand.includes('/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/npx')) {
        console.log('✅ config中的command路径已更新');
      }
    }
    
    // 检查目录配置
    if (content.includes('/Users/eatin-li/Desktop') && content.includes('/Users/eatin-li/IdeaProjects/voidmuse1')) {
      console.log('✅ 目录配置正确（包含Desktop和voidmuse1）');
    } else {
      console.log('⚠️  目录配置可能不完整');
    }
    
  } catch (error) {
    console.error('❌ 读取插件配置文件失败:', error.message);
  }
} else {
  console.error('❌ 找不到插件配置文件:', pluginFile);
}

// 4. 检查日志错误
console.log('\n=== 4. 最近的MCP错误日志 ===');
try {
  const logFile = '/Users/eatin-li/Library/Logs/JetBrains/IdeaIC2023.1/idea.log';
  if (fs.existsSync(logFile)) {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const recentErrors = logContent.split('\n')
      .filter(line => line.includes('MCP') || line.includes('mcp') || line.includes('npx'))
      .filter(line => line.includes('ERROR') || line.includes('SEVERE') || line.includes('Failed'))
      .slice(-5);
    
    if (recentErrors.length > 0) {
      recentErrors.forEach(error => console.log(`❌ ${error.trim()}`));
    } else {
      console.log('✅ 最近没有MCP相关错误');
    }
  }
} catch (error) {
  console.log('⚠️  无法读取日志文件:', error.message);
}

// 5. 建议解决方案
console.log('\n=== 5. 建议解决方案 ===');
console.log('1. 如果command路径还是\"npx\"，请运行: node fix-mcp-path-issue.js');
console.log('2. 如果config中的command未更新，请手动检查IntelliJ MCP配置');
console.log('3. 确保IntelliJ有权限访问Node.js和npx');
console.log('4. 检查防火墙或安全软件是否阻止IntelliJ启动子进程');
console.log('5. 尝试完全重启IntelliJ IDEA，不只是重新加载项目');

console.log('\n🔧 诊断完成！');