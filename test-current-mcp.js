#!/usr/bin/env node

/**
 * 测试当前MCP配置
 * 用于验证MCP服务器是否能正常启动和响应
 */

const { spawn } = require('child_process');
const path = require('path');

// MCP配置
const mcpConfig = {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/eatin-li/Desktop', '/Users/eatin-li/IdeaProjects/voidmuse1'],
  type: 'stdio'
};

console.log('🚀 开始测试MCP连接...');
console.log('配置:', JSON.stringify(mcpConfig, null, 2));

function testMcpConnection() {
  return new Promise((resolve, reject) => {
    console.log(`📦 启动MCP服务器: ${mcpConfig.command} ${mcpConfig.args.join(' ')}`);
    
    const serverProcess = spawn(mcpConfig.command, mcpConfig.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';
    let isInitialized = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('📤 服务器输出:', output.trim());
      
      // 检查是否收到工具列表响应
      if (output.includes('tools/list') || output.includes('"method":"tools/list"')) {
        console.log('✅ 检测到工具列表响应');
        isInitialized = true;
      }
      // 检查是否收到实际的工具数据
      if (output.includes('"name":"read_file"') || output.includes('"tools":[')) {
        console.log('✅ 检测到工具数据');
        isInitialized = true;
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error('❌ 服务器错误:', error.trim());
    });

    serverProcess.on('error', (error) => {
      console.error('❌ 启动进程失败:', error.message);
      reject(error);
    });

    serverProcess.on('close', (code) => {
      console.log(`🏁 进程退出，代码: ${code}`);
      // 如果收到工具列表响应，则认为测试成功，无论退出代码如何
      if (isInitialized) {
        console.log('✅ MCP测试成功完成');
        resolve({ success: true, stdout, stderr });
      } else {
        console.log('❌ MCP测试失败');
        resolve({ success: false, stdout, stderr, exitCode: code });
      }
    });

    // 发送初始化请求
    setTimeout(() => {
      console.log('📤 发送初始化请求...');
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {}
        }
      };
      
      try {
        serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
        console.log('✅ 初始化请求已发送');
      } catch (error) {
        console.error('❌ 发送初始化请求失败:', error.message);
      }
    }, 1000);

    // 请求工具列表
    setTimeout(() => {
      console.log('📤 请求工具列表...');
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };
      
      try {
        serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
        console.log('✅ 工具列表请求已发送');
      } catch (error) {
        console.error('❌ 发送工具列表请求失败:', error.message);
      }
    }, 2000);

    // 5秒后结束测试
    setTimeout(() => {
      console.log('⏰ 测试超时，正在结束进程...');
      try {
        serverProcess.stdin.write('{"jsonrpc":"2.0","id":3,"method":"shutdown"}\n');
        setTimeout(() => {
          serverProcess.kill('SIGTERM');
        }, 1000);
      } catch (error) {
        console.error('❌ 发送关闭请求失败:', error.message);
        serverProcess.kill('SIGTERM');
      }
    }, 5000);
  });
}

// 运行测试
async function runTest() {
  try {
    console.log('🎯 开始MCP连接测试...\n');
    
    // 检查Node.js
    console.log('🔍 检查Node.js环境...');
    const nodeVersion = process.version;
    console.log(`✅ Node.js版本: ${nodeVersion}`);
    
    // 检查npx
    console.log('\n🔍 检查npx可用性...');
    const npxCheck = spawn('which', ['npx']);
    npxCheck.on('close', async (code) => {
      if (code === 0) {
        console.log('✅ npx已安装');
        
        // 运行MCP测试
        console.log('\n🚀 开始MCP服务器测试...\n');
        const result = await testMcpConnection();
        
        console.log('\n📊 测试结果:');
        console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`退出代码: ${result.exitCode || 0}`);
        
        if (result.stdout) {
          console.log('\n📤 标准输出:');
          console.log(result.stdout);
        }
        
        if (result.stderr) {
          console.log('\n❌ 错误输出:');
          console.log(result.stderr);
        }
        
        if (result.success) {
          console.log('\n🎉 MCP连接测试通过！服务器可以正常启动和响应。');
          console.log('💡 如果IntelliJ插件仍然连接失败，请检查插件配置和日志。');
        } else {
          console.log('\n❌ MCP连接测试失败。请检查:');
          console.log('1. Node.js和npm/npx是否正确安装');
          console.log('2. 网络连接是否正常');
          console.log('3. @modelcontextprotocol/server-filesystem包是否可访问');
          console.log('4. 文件路径权限是否正确');
        }
        
      } else {
        console.log('❌ npx未找到，请安装Node.js和npm');
      }
    });
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error(error.stack);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTest();
}

module.exports = { testMcpConnection };