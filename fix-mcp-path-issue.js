#!/usr/bin/env node

/**
 * 修复MCP连接问题 - PATH环境变量版本
 * 
 * 问题：IntelliJ无法找到npx命令，因为Node.js不在PATH中
 * 解决方案：修改MCP配置，使用npx的完整路径
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 找到npx的完整路径
function findNpxPath() {
    try {
        // 尝试多种方式找到npx
        const possiblePaths = [
            '/usr/local/bin/npx',
            '/opt/homebrew/bin/npx',
            process.env.HOME + '/.nvm/versions/node/*/bin/npx',
            '/usr/bin/npx'
        ];
        
        // 使用which命令
        try {
            return execSync('which npx', { encoding: 'utf8' }).trim();
        } catch (e) {
            // 如果which失败，手动检查路径
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    return possiblePath;
                }
            }
            
            // 尝试使用glob模式查找
            const glob = require('glob');
            const matches = glob.sync(process.env.HOME + '/.nvm/versions/node/*/bin/npx');
            if (matches.length > 0) {
                return matches[0];
            }
        }
        
        throw new Error('npx not found in any expected location');
    } catch (error) {
        console.error('查找npx路径失败:', error.message);
        return null;
    }
}

// 更新MCP配置
function updateMcpConfig() {
    const pluginConfigPath = '/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1/options/plugin.xml';
    
    if (!fs.existsSync(pluginConfigPath)) {
        console.error('插件配置文件不存在:', pluginConfigPath);
        return false;
    }
    
    const npxPath = findNpxPath();
    if (!npxPath) {
        console.error('无法找到npx命令，请确保Node.js已安装');
        console.log('你可以通过以下方式安装Node.js:');
        console.log('1. 访问 https://nodejs.org/ 下载安装');
        console.log('2. 使用Homebrew: brew install node');
        return false;
    }
    
    console.log('找到npx路径:', npxPath);
    
    try {
        let content = fs.readFileSync(pluginConfigPath, 'utf8');
        
        // 查找并替换MCP配置中的npx命令
        const mcpPattern = /(&quot;command&quot;:\s*&quot;)npx(&quot;)/;
        
        if (mcpPattern.test(content)) {
            const newContent = content.replace(mcpPattern, `$1${npxPath}$2`);
            
            // 备份原始文件
            const backupPath = pluginConfigPath + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, content);
            console.log('已创建备份文件:', backupPath);
            
            // 写入新配置
            fs.writeFileSync(pluginConfigPath, newContent);
            console.log('✅ MCP配置已更新，使用npx完整路径:', npxPath);
            console.log('请重启IntelliJ IDEA使更改生效');
            
            return true;
        } else {
            console.log('未找到需要替换的npx命令');
            return false;
        }
    } catch (error) {
        console.error('更新配置文件失败:', error.message);
        return false;
    }
}

// 验证Node.js环境
function validateNodeEnvironment() {
    console.log('=== Node.js环境检查 ===');
    
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log('✅ Node.js版本:', nodeVersion);
    } catch (error) {
        console.log('❌ Node.js未安装或不在PATH中');
    }
    
    try {
        const npxVersion = execSync('npx --version', { encoding: 'utf8' }).trim();
        console.log('✅ npx版本:', npxVersion);
    } catch (error) {
        console.log('❌ npx未安装或不在PATH中');
    }
    
    const npxPath = findNpxPath();
    if (npxPath) {
        console.log('✅ npx完整路径:', npxPath);
    }
    
    console.log('');
}

// 主函数
function main() {
    console.log('🚀 开始修复MCP连接问题...\n');
    
    validateNodeEnvironment();
    
    const success = updateMcpConfig();
    
    if (success) {
        console.log('\n🎉 修复完成！');
        console.log('下一步:');
        console.log('1. 重启IntelliJ IDEA');
        console.log('2. 检查MCP连接状态');
        console.log('3. 如果仍有问题，请查看日志');
    } else {
        console.log('\n❌ 修复失败，请检查上述错误信息');
    }
}

if (require.main === module) {
    main();
}

module.exports = { findNpxPath, updateMcpConfig };