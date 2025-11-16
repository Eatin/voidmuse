#!/bin/bash
# 启用VoidMuse插件开发模式
export VOIDMUSE_DEV_MODE=true
echo "开发模式已启用，重启IDEA后插件将连接到本地服务器 http://localhost:3002/"
echo "请确保本地服务器正在运行：cd gui && npm run dev"