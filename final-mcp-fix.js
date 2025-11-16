#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 最终MCP修复方案\n');

// 1. 获取npx完整路径
const npxPath = execSync('which npx', { encoding: 'utf8' }).trim();
console.log(`✅ npx路径: ${npxPath}`);

// 2. 创建完整的MCP配置
const mcpConfig = {
  "mcpServers": {
    "filesystem": {
      "command": npxPath,
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/eatin-li/Desktop",
        "/Users/eatin-li/IdeaProjects/voidmuse1"
      ]
    }
  }
};

// 3. 写入配置文件
const configContent = JSON.stringify(mcpConfig, null, 2);
fs.writeFileSync('/Users/eatin-li/IdeaProjects/voidmuse1/mcp-config-final.json', configContent);
console.log('✅ 创建完整MCP配置文件');

// 4. 生成IntelliJ配置更新命令
const intellijConfig = `[{&quot;key&quot;:&quot;1763141421032&quot;,&quot;name&quot;:&quot;filesystem&quot;,&quot;url&quot;:&quot;&quot;,&quot;command&quot;:&quot;${npxPath}&quot;,&quot;args&quot;:[&quot;-y&quot;,&quot;@modelcontextprotocol/server-filesystem&quot;,&quot;/Users/eatin-li/Desktop&quot;,&quot;/Users/eatin-li/IdeaProjects/voidmuse1&quot;],&quot;headers&quot;:{},&quot;config&quot;:&quot;${JSON.stringify(configContent).replace(/"/g, '\\&quot;')}&quot;,&quot;connected&quot;:false,&quot;enabled&quot;:true,&quot;mcpId&quot;:&quot;filesystem&quot;}]`;

console.log('\n📝 手动修复步骤：');
console.log('1. 完全关闭IntelliJ IDEA（不只是关闭项目）');
console.log('2. 备份配置文件：');
console.log('   cp "/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml" "/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml.backup.final"');
console.log('3. 编辑配置文件，找到包含"VoidMuseDataState:global:mcps"的行');
console.log('4. 替换整个value值为：');
console.log(`   ${intellijConfig}`);
console.log('5. 保存文件并重启IntelliJ IDEA');

// 5. 测试MCP服务器
console.log('\n🔍 测试MCP服务器...');
try {
  const testCmd = `echo '{"jsonrpc":"2.0","method":"mcp.listTools","id":1}' | ${npxPath} -y @modelcontextprotocol/server-filesystem /Users/eatin-li/Desktop /Users/eatin-li/IdeaProjects/voidmuse1`;
  const result = execSync(testCmd, { encoding: 'utf8', timeout: 5000, shell: true });
  
  if (result.includes('list_tools')) {
    console.log('✅ MCP服务器测试通过');
  } else {
    console.log('⚠️  MCP服务器响应:', result.substring(0, 100));
  }
} catch (error) {
  console.log('❌ MCP服务器测试失败:', error.message);
}

// 6. 权限检查
console.log('\n🔒 权限检查...');
try {
  const checkPerms = (path) => {
    try {
      fs.accessSync(path, fs.constants.R_OK | fs.constants.X_OK);
      console.log(`✅ ${path} 可访问`);
      return true;
    } catch (e) {
      console.log(`❌ ${path} 权限不足`);
      return false;
    }
  };
  
  checkPerms('/Users/eatin-li/Desktop');
  checkPerms('/Users/eatin-li/IdeaProjects/voidmuse1');
  checkPerms(npxPath);
  
} catch (error) {
  console.log('❌ 权限检查失败:', error.message);
}

console.log('\n🎯 总结：');
console.log('MCP连接失败的根本原因可能是：');
console.log('1. IntelliJ无法正确解析转义字符');
console.log('2. 配置文件格式问题');
console.log('3. 环境变量在IntelliJ进程中不可用');
console.log('4. 权限问题阻止IntelliJ启动子进程');

console.log('\n💡 建议：');
console.log('1. 尝试完全重启系统（不只是IntelliJ）');
console.log('2. 检查系统防火墙和安全设置');
console.log('3. 考虑使用绝对路径的shell脚本作为中间层');
console.log('4. 或者等待VoidMuse插件更新修复此问题');