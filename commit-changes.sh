#!/bin/bash

# 🚀 Git提交脚本 - 提交MCP连接修复相关的所有更改

echo "🚀 准备提交MCP连接修复相关的代码更改..."

# 1. 显示当前状态
echo "📋 当前Git状态:"
git status --short

# 2. 添加所有新创建的文件
echo ""
echo "📁 添加新创建的文件:"

# MCP修复相关文件
echo "添加MCP修复相关文件..."
git add *.js *.json *.md *.sh 2>/dev/null || true

# 具体添加我们创建的文件
git add diagnose-mcp-issue.js final-mcp-fix.js fix-mcp-complete.js fix-mcp-path-issue.js 2>/dev/null || true
git add test-current-mcp.js test-mcp-connection.js verify-mcp-config.js view-mcp-logs.js 2>/dev/null || true
git add find-intellij-terminal-path.js set-intellij-mcp-config.js set-mcp-config-direct.js 2>/dev/null || true
git add quick-npx-setup.sh verify-intellij-env.sh idea-with-node.sh 2>/dev/null || true
git add mcp-config-*.json 2>/dev/null || true
git add intellij-*.md MCP-*.md 2>/dev/null || true

# 3. 检查是否有已修改的文件需要添加
echo ""
echo "🔍 检查修改的文件:"
MODIFIED_FILES=$(git status --porcelain | grep -E "^ M|^M " | cut -d' ' -f3)
if [ -n "$MODIFIED_FILES" ]; then
    echo "发现修改的文件，正在添加..."
    echo "$MODIFIED_FILES" | while read file; do
        if [ -n "$file" ]; then
            git add "$file"
            echo "  ✅ 已添加: $file"
        fi
    done
fi

# 4. 显示将要提交的文件
echo ""
echo "📦 将要提交的文件列表:"
git diff --cached --name-only

# 5. 统计更改
echo ""
echo "📊 更改统计:"
git diff --cached --stat

# 6. 生成提交信息
echo ""
echo "📝 生成提交信息..."
COMMIT_MSG="🚀 fix: 修复MCP连接问题并优化IntelliJ IDEA环境配置

✅ MCP连接修复:
- 修复npx路径配置问题，使用完整路径替代相对路径
- 创建完整的MCP连接诊断和修复工具
- 解决MCP服务器连接失败问题
- 优化MCP配置文件格式和参数

🔧 IntelliJ IDEA环境优化:
- 创建npx环境配置脚本和自动化工具
- 添加IntelliJ终端配置路径查找工具
- 提供完整的IDE环境配置指南
- 创建环境验证和测试脚本

📋 新增工具和功能:
- diagnose-mcp-issue.js: MCP连接诊断工具
- final-mcp-fix.js: 最终MCP修复方案
- quick-npx-setup.sh: 快速npx环境配置
- find-intellij-terminal-path.js: IDE配置路径查找
- view-mcp-logs.js: MCP日志查看工具
- verify-intellij-env.sh: 环境验证脚本

📚 文档和指南:
- 创建详细的MCP连接问题诊断报告
- 提供IntelliJ IDEA npx环境配置完整指南
- 添加配置路径查找和版本差异说明
- 创建最佳实践和问题排查指南

🎯 关键修复:
- 修复plugin.xml中MCP配置的转义字符问题
- 解决Node.js环境变量配置问题
- 优化MCP服务器启动参数和路径配置
- 提供多种备用解决方案和临时修复方案"

# 7. 确认提交
echo ""
echo "请确认是否执行提交操作:"
echo "提交信息预览:"
echo "----------------------------------------"
echo "$COMMIT_MSG"
echo "----------------------------------------"
echo ""
read -p "是否继续提交? (y/N): " CONFIRM

if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 执行提交..."
    git commit -m "$COMMIT_MSG"
    
    # 8. 推送到远程仓库
    echo ""
    echo "📤 推送到远程仓库..."
    git push origin main
    
    echo ""
    echo "✅ 提交和推送完成！"
    echo "📊 提交统计:"
    git log --stat -1
    
else
    echo ""
    echo "❌ 提交已取消"
    echo "💡 提示: 你可以手动执行以下命令来提交:"
    echo "   git commit -m \"你的提交信息\""
    echo "   git push origin main"
fi

# 9. 显示最终状态
echo ""
echo "📋 最终Git状态:"
git status