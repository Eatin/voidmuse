#!/bin/bash
echo "🔍 验证IntelliJ IDEA Node.js环境..."
echo "Node.js版本: $(node --version)"
echo "npx版本: $(npx --version)"
echo "npx路径: $(which npx)"
echo "PATH包含Node.js: $(echo $PATH | grep -q '/Users/eatin-li/.nvm/versions/node/v24.11.0/bin' && echo '✅' || echo '❌')"

# 测试npx命令
echo "测试npx命令..."
if npx --help > /dev/null 2>&1; then
    echo "✅ npx命令正常工作"
else
    echo "❌ npx命令测试失败"
fi

# 测试MCP服务器
echo "测试MCP服务器连接..."
if NODE_PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/node timeout 5 npx @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1; then
    echo "✅ MCP服务器可访问"
else
    echo "⚠️  MCP服务器测试超时或失败"
fi
