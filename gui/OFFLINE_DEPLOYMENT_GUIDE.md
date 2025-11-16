# 离线部署指南

## 问题描述
在离线Linux ARM64机器上执行GUI项目时，出现以下错误：
```
can not find module @rollup/rollup-linux-arm64-gnu
```

## 解决方案

### 方案1：使用预打包的Linux ARM64版本（推荐）
我们已为您准备了包含Linux ARM64特定依赖的完整打包文件：
- 文件：`gui-linux-arm64-final.tar.gz`
- 大小：约125MB
- 包含：`@rollup/rollup-linux-arm64-gnu`和`@esbuild/linux-arm64@0.21.5`依赖（已解决版本不匹配问题）

使用方法：
```bash
# 解压文件
tar -xzf gui-linux-arm64-offline.tar.gz

# 进入项目目录
cd gui

# 直接运行开发服务器
npm run dev
```

### 方案2：配置文件法
1. 使用我们提供的 `.npmrc` 配置文件
2. 在项目根目录执行：
   ```bash
   npm install --no-optional
   ```

### 方案3：部署脚本法
1. 使用我们提供的 `deploy-offline.sh` 脚本
2. 在项目根目录执行：
   ```bash
   chmod +x deploy-offline.sh
   ./deploy-offline.sh
   ```

### 方案4：手动解决步骤
1. 清理现有依赖：
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. 配置npm忽略可选依赖：
   ```bash
   echo "optional=false" >> .npmrc
   echo "force=true" >> .npmrc
   ```

3. 重新安装依赖：
   ```bash
   npm install --no-optional
   ```

4. 如果仍然报错，手动安装缺失的包：
   ```bash
   npm install @rollup/rollup-linux-arm64-gnu --save-dev
   ```

### 方案5：备用方案
如果上述方法都无效，可以尝试：
```bash
npm install --force --no-optional
```

## 打包说明
- `gui-linux-arm64-offline.tar.gz`：专门为Linux ARM64系统打包，包含所有依赖
- `gui.zip`：轻量级源码包，需要在线安装依赖

## 验证安装
安装完成后，可以通过以下命令验证：
```bash
npm list @rollup/rollup-linux-arm64-gnu
```

## 文件清单
预打包的Linux ARM64版本包含：
- ✅ `@rollup/rollup-linux-arm64-gnu`依赖（Rollup打包工具）
- ✅ `@esbuild/linux-arm64@0.21.5`依赖（Vite/esbuild构建工具，已解决版本不匹配）
- ✅ 所有node_modules
- ✅ 配置文件（.npmrc）
- ✅ 部署脚本（deploy-offline.sh）
- ✅ 项目源代码

打包文件中包含以下关键依赖：
- `node_modules/@rollup/rollup-linux-arm64-gnu/` - Rollup打包工具（Linux ARM64版本）
- `node_modules/@esbuild/linux-arm64@0.21.5/` - Vite/esbuild构建工具（Linux ARM64版本，已解决版本不匹配问题）
- `node_modules/@rollup/rollup-darwin-arm64/` - Rollup打包工具（macOS ARM64版本）
- `node_modules/@esbuild/darwin-arm64@0.21.5/` - Vite/esbuild构建工具（macOS ARM64版本）

## 常见问题解决
**问题：** `service host version 0.21.5 does not match 0.27.0`
**原因：** 项目中的Vite 5.4.20依赖esbuild 0.21.5，但package.json中指定了esbuild 0.27.0
**解决：** 已将esbuild版本统一为0.21.5，确保与Vite 5.4.20完全兼容