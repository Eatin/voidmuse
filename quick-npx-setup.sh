#!/bin/bash

# 🚀 IntelliJ IDEA npx环境快速配置脚本
# 适用于macOS系统

echo "🚀 开始配置IntelliJ IDEA npx环境..."

# 1. 检查npx安装
echo "📋 检查npx安装状态..."
NPX_PATH=$(which npx)
if [ -z "$NPX_PATH" ]; then
    echo "❌ npx未安装，请先安装Node.js和npx"
    exit 1
fi

echo "✅ npx路径: $NPX_PATH"

# 2. 获取Node.js路径
NODE_PATH=$(which node)
NODE_DIR=$(dirname "$NPX_PATH")
echo "✅ Node.js路径: $NODE_PATH"
echo "✅ Node.js目录: $NODE_DIR"

# 3. 创建IDEA启动脚本
echo "📝 创建IDEA启动脚本..."
cat > idea-with-node.sh << EOF
#!/bin/bash
# IntelliJ IDEA with Node.js环境配置
export PATH="$NODE_DIR:\$PATH"
export NODE_PATH="$NODE_PATH"
echo "🚀 启动IntelliJ IDEA，Node.js环境已配置"
open -a "IntelliJ IDEA CE"
EOF

chmod +x idea-with-node.sh

# 4. 创建项目环境文件
echo "📝 创建项目环境配置文件..."
cat > .env.intellij << EOF
# IntelliJ IDEA Node.js环境配置
NODE_PATH=$NODE_PATH
PATH=$NODE_DIR:\$PATH
NPX_PATH=$NPX_PATH
EOF

# 5. 创建package.json脚本配置
echo "📝 更新package.json脚本..."
if [ -f "package.json" ]; then
    # 备份原文件
    cp package.json package.json.backup
    
    # 使用Node.js更新package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!pkg.scripts) pkg.scripts = {};
    
    // 添加带有正确路径的脚本
    pkg.scripts['dev:intellij'] = 'NODE_PATH=$NODE_PATH npx vite';
    pkg.scripts['build:intellij'] = 'NODE_PATH=$NODE_PATH npx vite build';
    pkg.scripts['mcp:test'] = 'NODE_PATH=$NODE_PATH npx @modelcontextprotocol/server-filesystem --help';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('✅ package.json已更新');
    "
fi

# 6. 创建IntelliJ运行配置
echo "📝 创建IntelliJ运行配置..."
mkdir -p .idea/runConfigurations
cat > .idea/runConfigurations/Development_with_Node.xml << EOF
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Development with Node" type="NodeJSConfigurationType" factoryName="Node.js">
    <working-dir value="\$PROJECT_DIR\$" />
    <path-to-node value="$NODE_PATH" />
    <path-to-npm value="$NODE_DIR/npm" />
    <envs>
      <env name="NODE_PATH" value="$NODE_PATH" />
      <env name="PATH" value="$NODE_DIR:\$PATH" />
    </envs>
    <method v="2" />
  </configuration>
</component>
EOF

# 7. 创建验证脚本
echo "📝 创建环境验证脚本..."
cat > verify-intellij-env.sh << EOF
#!/bin/bash
echo "🔍 验证IntelliJ IDEA Node.js环境..."
echo "Node.js版本: \$(node --version)"
echo "npx版本: \$(npx --version)"
echo "npx路径: \$(which npx)"
echo "PATH包含Node.js: \$(echo \$PATH | grep -q '$NODE_DIR' && echo '✅' || echo '❌')"

# 测试npx命令
echo "测试npx命令..."
if npx --help > /dev/null 2>&1; then
    echo "✅ npx命令正常工作"
else
    echo "❌ npx命令测试失败"
fi

# 测试MCP服务器
echo "测试MCP服务器连接..."
if NODE_PATH=$NODE_PATH timeout 5 npx @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1; then
    echo "✅ MCP服务器可访问"
else
    echo "⚠️  MCP服务器测试超时或失败"
fi
EOF

chmod +x verify-intellij-env.sh

# 8. 输出使用说明
echo ""
echo "🎉 npx环境配置完成！"
echo ""
echo "📖 使用说明："
echo "1. 启动IntelliJ IDEA: ./idea-with-node.sh"
echo "2. 验证环境: ./verify-intellij-env.sh"
echo "3. 在IDE中使用更新的脚本: npm run dev:intellij"
echo "4. 测试MCP连接: npm run mcp:test"
echo ""
echo "🔧 手动配置步骤："
echo "1. 打开IntelliJ IDEA"
echo "2. 进入 Preferences → Tools → Terminal"
echo "3. 在 Environment variables 中添加:"
echo "   PATH=$NODE_DIR:\$PATH"
echo "4. 重启IDE使配置生效"
echo ""
echo "📁 创建的文件："
echo "- idea-with-node.sh (IDEA启动脚本)"
echo "- .env.intellij (环境变量文件)"
echo "- verify-intellij-env.sh (验证脚本)"
echo "- .idea/runConfigurations/Development_with_Node.xml (运行配置)"
if [ -f "package.json.backup" ]; then
    echo "- package.json (已更新，备份为package.json.backup)"
fi

echo ""
echo "🚀 现在你可以启动IntelliJ IDEA并开始使用了！"