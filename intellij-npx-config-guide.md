# 🚀 IntelliJ IDEA npx 环境配置完整指南

## 📋 配置前检查

### 1. 确认npx安装状态
```bash
# 检查npx路径
which npx
# 输出示例: /Users/eatin-li/.nvm/versions/node/v24.11.0/bin/npx

# 检查npx版本
npx --version
# 输出示例: 11.6.1

# 检查Node.js版本
node --version
# 输出示例: v24.11.0
```

### 2. 环境变量检查
```bash
# 检查PATH环境变量
echo $PATH

# 检查Node.js相关环境变量
echo $NODE_PATH
echo $NVM_DIR
```

## 🔧 IntelliJ IDEA 配置步骤

### 方法1：通过IDE设置界面配置

#### 步骤1：打开Node.js配置
1. 打开 IntelliJ IDEA
2. 进入 `Preferences` → `Languages & Frameworks` → `Node.js and NPM`
3. 在 `Node interpreter` 中选择正确的Node.js路径
4. 确保 `Package manager` 设置为正确的npm路径

#### 步骤2：配置环境变量
1. 进入 `Preferences` → `Tools` → `Terminal`
2. 在 `Environment variables` 中添加：
   ```
   PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin:$PATH
   ```
3. 勾选 `Add IDE classpath to terminal`

#### 步骤3：配置运行配置
1. 进入 `Run` → `Edit Configurations`
2. 选择你的运行配置
3. 在 `Environment variables` 中添加Node.js路径

### 方法2：手动配置项目环境

#### 步骤1：创建环境配置文件
在项目根目录创建 `.env` 文件：
```bash
# Node.js环境配置
NODE_PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin
PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin:$PATH
```

#### 步骤2：配置npm脚本
在 `package.json` 中配置脚本：
```json
{
  "scripts": {
    "dev": "NODE_PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin npx vite",
    "build": "NODE_PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin npx vite build"
  }
}
```

### 方法3：配置IntelliJ启动环境

#### 步骤1：编辑启动脚本
创建启动脚本 `idea-startup.sh`：
```bash
#!/bin/bash
export NODE_PATH=/Users/eatin-li/.nvm/versions/node/v24.11.0/bin
export PATH=$NODE_PATH:$PATH
open -a "IntelliJ IDEA CE"
```

#### 步骤2：使用脚本启动IDE
```bash
chmod +x idea-startup.sh
./idea-startup.sh
```

## 🔍 验证配置

### 1. 在IDE终端中测试
```bash
# 在IntelliJ的Terminal中运行
which npx
npx --version
node --version
```

### 2. 测试npx命令
```bash
# 测试npx是否能正常使用
npx create-react-app test-app
# 或
npx vite --version
```

### 3. 测试项目运行
```bash
# 在项目中测试
npm run dev
# 或
npx vite
```

## 🛠️ 常见问题解决

### 问题1：npx命令找不到
**症状**：`npx: command not found`
**解决**：
1. 确认npx已安装：`npm install -g npx`
2. 检查PATH配置是否正确
3. 重启IntelliJ IDEA

### 问题2：权限问题
**症状**：`EACCES: permission denied`
**解决**：
```bash
# 修复npm权限
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### 问题3：版本不匹配
**症状**：`npx`使用的Node.js版本与预期不符
**解决**：
1. 使用nvm管理Node.js版本
2. 在项目目录创建 `.nvmrc` 文件指定版本
3. 运行 `nvm use` 切换版本

### 问题4：MCP连接问题
**症状**：MCP服务器连接失败
**解决**：
1. 检查npx路径配置（使用完整路径）
2. 确认防火墙设置
3. 检查MCP配置格式

## 📝 最佳实践

### 1. 使用nvm管理Node.js
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装特定Node.js版本
nvm install 24.11.0
nvm use 24.11.0
nvm alias default 24.11.0
```

### 2. 项目级配置
在每个项目中创建 `.nvmrc` 文件：
```
24.11.0
```

### 3. IDE配置文件
编辑IntelliJ配置文件：
```bash
# 配置文件位置
~/Library/Preferences/IntelliJIdea2023.1/options/other.xml
```

### 4. 环境变量持久化
在 `~/.zshrc` 或 `~/.bash_profile` 中添加：
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/Users/eatin-li/.nvm/versions/node/v24.11.0/bin:$PATH"
```

## 🔧 高级配置

### 配置多个Node.js版本
```bash
# 安装多个版本
nvm install 18.17.0
nvm install 20.9.0
nvm install 24.11.0

# 项目特定版本
nvm use 24.11.0
```

### 配置代理（如需要）
```bash
# npm代理配置
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# npx代理配置
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## 📚 相关文件位置

- **Node.js安装**: `/Users/eatin-li/.nvm/versions/node/v24.11.0/`
- **npx路径**: `/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/npx`
- **npm路径**: `/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/npm`
- **IntelliJ配置**: `/Users/eatin-li/Library/Preferences/IntelliJIdea2023.1/options/`
- **项目配置**: `/Users/eatin-li/IdeaProjects/voidmuse1/`

## 🎯 验证成功标志

✅ **配置成功的标志**:
- 在IntelliJ终端中 `which npx` 返回正确路径
- `npx --version` 显示版本号
- 项目可以正常使用npx命令
- MCP服务器能够正常连接

❌ **需要检查的标志**:
- npx命令找不到
- 版本号不匹配
- 权限错误
- MCP连接失败

按照以上步骤配置后，你的IntelliJ IDEA应该能够正常使用npx环境了！