#!/usr/bin/env node

// Test MCP filesystem server connection
const { spawn } = require('child_process');

async function testMcpConnection() {
  console.log('Testing MCP filesystem server connection...');
  
  // Test the MCP filesystem server
  const mcpProcess = spawn('npx', [
    '-y', 
    '@modelcontextprotocol/server-filesystem',
    '/Users/eatin-li/Desktop',
    '/Users/eatin-li/IdeaProjects/voidmuse1'
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  mcpProcess.stdout.on('data', (data) => {
    stdout += data.toString();
    console.log('MCP stdout:', data.toString());
  });

  mcpProcess.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log('MCP stderr:', data.toString());
  });

  // Send initialize request
  setTimeout(() => {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true }
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };
    
    console.log('Sending initialize request...');
    mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  }, 1000);

  // Send tools/list request after initialize
  setTimeout(() => {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    
    console.log('Sending tools/list request...');
    mcpProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
  }, 2000);

  // Terminate after testing
  setTimeout(() => {
    console.log('Terminating MCP process...');
    mcpProcess.kill('SIGTERM');
  }, 3000);

  return new Promise((resolve) => {
    mcpProcess.on('close', (code) => {
      console.log(`MCP process exited with code ${code}`);
      console.log('Final stdout:', stdout);
      console.log('Final stderr:', stderr);
      resolve({ code, stdout, stderr });
    });
  });
}

testMcpConnection().catch(console.error);