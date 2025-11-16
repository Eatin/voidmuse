#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 查找IntelliJ IDEA终端配置路径\n');

// 1. 查找配置目录
const configPaths = [
    "/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.1",
    "/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2023.2", 
    "/Users/eatin-li/Library/Application Support/JetBrains/IdeaIC2024.1",
    "/Users/eatin-li/Library/Application Support/JetBrains/IntelliJIdea2023.1",
    "/Users/eatin-li/Library/Application Support/JetBrains/IntelliJIdea2023.2"
];

let intellijPath = null;
for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
        console.log(`✅ 找到IntelliJ配置目录: ${configPath}`);
        intellijPath = configPath;
        break;
    }
}

if (!intellijPath) {
    console.log('❌ 未找到IntelliJ配置目录');
    process.exit(1);
}

// 2. 查找配置文件
const optionsPath = path.join(intellijPath, 'options');
console.log(`\n📁 配置文件目录: ${optionsPath}`);

// 3. 查找终端相关文件
const terminalFiles = fs.readdirSync(optionsPath).filter(file => 
    file.toLowerCase().includes('terminal') || 
    file.toLowerCase().includes('general') ||
    file.toLowerCase().includes('ide')
);

console.log('\n📋 找到的相关配置文件:');
terminalFiles.forEach(file => {
    console.log(`   - ${file}`);
});

// 4. 分析配置文件内容
console.log('\n🔍 分析配置文件内容:');

// 检查 ide.general.xml
const generalConfigPath = path.join(optionsPath, 'ide.general.xml');
if (fs.existsSync(generalConfigPath)) {
    console.log(`\n📄 ${generalConfigPath}:`);
    const content = fs.readFileSync(generalConfigPath, 'utf8');
    
    // 查找终端相关配置
    if (content.includes('terminal')) {
        console.log('   ✅ 包含终端配置');
        
        // 提取终端配置
        const terminalMatch = content.match(/<component name="GeneralSettings"[^>]*>([\s\S]*?)<\/component>/);
        if (terminalMatch) {
            console.log('   终端配置内容:');
            console.log('   ' + terminalMatch[1].replace(/\n/g, '\n   '));
        }
    } else {
        console.log('   ℹ️  未找到终端配置');
    }
}

// 5. 查找正确的配置路径
console.log('\n🎯 正确的配置路径:');
console.log('根据你的IntelliJ版本，配置路径应该是:');
console.log(`   ${intellijPath}`);

// 6. 提供配置建议
console.log('\n⚙️ 终端配置建议:');
console.log('');
console.log('方法1: 通过IDE界面配置');
console.log('1. 打开IntelliJ IDEA');
console.log('2. 按 ⌘, 打开Preferences');
console.log('3. 在搜索框输入 "terminal"');
console.log('4. 选择找到的终端配置选项');
console.log('');
console.log('方法2: 手动添加配置');
console.log(`编辑文件: ${generalConfigPath}`);
console.log('添加或修改以下内容:');
console.log('');
console.log('<application>');
console.log('  <component name="GeneralSettings">');
console.log('    <option name="terminalShell" value="/bin/zsh" />');
console.log('    <option name="terminalShellOptions" value="-l" />');
console.log('    <envs>');
console.log('      <env name="PATH" value="/Users/eatin-li/.nvm/versions/node/v24.11.0/bin:$PATH" />');
console.log('      <env name="NODE_PATH" value="/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/node" />');
console.log('    </envs>');
console.log('  </component>');
console.log('</application>');

// 7. 检查plugin.xml中的MCP配置
const pluginConfigPath = path.join(optionsPath, 'plugin.xml');
if (fs.existsSync(pluginConfigPath)) {
    console.log('\n🔌 MCP插件配置检查:');
    const pluginContent = fs.readFileSync(pluginConfigPath, 'utf8');
    
    if (pluginContent.includes('VoidMuseDataState:global:mcps')) {
        console.log('   ✅ 找到MCP配置');
        
        // 提取MCP配置
        const mcpMatch = pluginContent.match(/VoidMuseDataState:global:mcps[^"]*"([^"]+)"/);
        if (mcpMatch) {
            console.log('   当前MCP配置:');
            console.log('   ' + mcpMatch[1]);
            
            // 检查是否使用完整路径
            if (mcpMatch[1].includes('command":"npx"')) {
                console.log('   ⚠️  警告: command仍然使用"npx"而不是完整路径');
            } else if (mcpMatch[1].includes('/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/npx')) {
                console.log('   ✅ command使用完整路径');
            }
        }
    } else {
        console.log('   ℹ️  未找到MCP配置');
    }
}

// 8. 创建配置文件（如果不存在）
if (!fs.existsSync(generalConfigPath)) {
    console.log('\n📝 创建新的配置文件:');
    const configContent = `<application>
  <component name="GeneralSettings">
    <option name="terminalShell" value="/bin/zsh" />
    <option name="terminalShellOptions" value="-l" />
    <envs>
      <env name="PATH" value="/Users/eatin-li/.nvm/versions/node/v24.11.0/bin:$PATH" />
      <env name="NODE_PATH" value="/Users/eatin-li/.nvm/versions/node/v24.11.0/bin/node" />
    </envs>
  </component>
</application>`;
    
    fs.writeFileSync(generalConfigPath, configContent);
    console.log(`   ✅ 已创建: ${generalConfigPath}`);
}

console.log('\n🎉 查找完成！');
console.log('\n💡 下一步:');
console.log('1. 重启IntelliJ IDEA');
console.log('2. 在IDE终端中测试: which npx');
console.log('3. 验证npx是否正常工作');