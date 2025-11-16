#!/bin/bash

echo "检查插件开发模式日志..."
echo "等待IDE启动完成..."

# 等待几秒钟让IDE启动
sleep 10

echo "=== 检查最新的插件日志 ==="
tail -50 ~/Library/Logs/JetBrains/IdeaIC2025.2/idea.log | grep -E "(Development mode|AdvancedToolWindow|VOIDMUSE|voidmuse|JCEF)"

echo ""
echo "=== 检查开发模式检测 ==="
grep -E "Development mode check" ~/Library/Logs/JetBrains/IdeaIC2025.2/idea.log | tail -5

echo ""
echo "=== 检查JCEF初始化 ==="
grep -E "JCEF|browser" ~/Library/Logs/JetBrains/IdeaIC2025.2/idea.log | tail -5