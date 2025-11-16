#!/bin/bash

# 解决rollup可选依赖问题的部署脚本
echo "开始解决rollup可选依赖问题..."

# 方法1: 清理并重新安装依赖
echo "清理node_modules和package-lock.json..."
rm -rf node_modules package-lock.json

# 方法2: 使用npm配置忽略可选依赖
echo "配置npm忽略可选依赖..."
cat > .npmrc << 'EOF'
# 解决rollup可选依赖问题
optional=false
force=true
platform-check=false
EOF

# 方法3: 重新安装依赖
echo "重新安装依赖..."
npm install --no-optional

# 方法4: 如果仍然有问题，手动安装缺失的包
echo "检查并安装缺失的rollup依赖..."
if [ ! -d "node_modules/@rollup/rollup-linux-arm64-gnu" ]; then
    echo "手动安装rollup依赖..."
    npm install @rollup/rollup-linux-arm64-gnu --save-dev --force
fi

echo "部署完成！"
echo "如果仍然有问题，请尝试以下命令："
echo "npm install --legacy-peer-deps"
echo "或者"
echo "npm install --force"