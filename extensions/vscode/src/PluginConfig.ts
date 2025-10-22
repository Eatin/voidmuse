import * as vscode from 'vscode';
import { Mutex } from 'async-mutex';
// 插件 ID
const extensionId = 'voidmuse';
// 创建全局锁实例
const configMutex = new Mutex();
// 配置模块
export const PluginConfig = {
  // 获取配置项
  get: <T>(key: string, defaultValue: T): T => {
    const config = vscode.workspace.getConfiguration(extensionId);
    const userConfig = config.get<{ [key: string]: any }>('userConfig', {});
    return userConfig[key] !== undefined ? userConfig[key] : defaultValue;
  },
  // 更新配置项
  update: <T>(key: string, value: T, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Thenable<void> => {
    const config = vscode.workspace.getConfiguration(extensionId);
    const userConfig = config.get<{ [key: string]: any }>('userConfig', {});
    userConfig[key] = value;
    return config.update('userConfig', userConfig, target);
  },
  // 批量获取配置项
  getAll: (): { [key: string]: any } => {
    const config = vscode.workspace.getConfiguration(extensionId);
    return config.get<{ [key: string]: any }>('userConfig', {});
  },
  // 批量更新配置项
  updateAll: (settings: { [key: string]: any }, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): undefined => {
    configMutex.runExclusive(async () => {
        const config = vscode.workspace.getConfiguration(extensionId);
        const userConfig = config.get<{ [key: string]: any }>('userConfig', {});
        Object.assign(userConfig, settings);
        return config.update('userConfig', userConfig, target);
    });
   return;
  },
  // 监听配置项变化
  onDidChangeConfiguration: (callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable => {
    return vscode.workspace.onDidChangeConfiguration(callback);
  }
};