#!/bin/bash
# 启动VoidMuse GUI服务器
cd gui
echo "正在安装依赖..."
npm install
echo "正在启动开发服务器..."
npm run dev